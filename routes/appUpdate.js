const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');

const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { check, validationResult } = require('express-validator');

const db = require('../models');
const { AppUpdate, AppInstallation } = db;

const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateDeviceInfo } = require('../middleware/deviceValidation');

const logger = require('../utils/logger');


/* =========================================================
   MULTER STORAGE
========================================================= */

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        const uploadDir = path.join(__dirname, '../uploads/app-updates');

        fs.ensureDirSync(uploadDir);

        cb(null, uploadDir);

    },

    filename: (req, file, cb) => {

        const versionCode = req.body.version_code || 'unknown';
        const versionName = (req.body.version_name || '0.0.0').replace(/\./g, '_');
        const channel = req.body.channel || 'stable';

        const filename =
            `app-${versionCode}-${versionName}-${channel}-${Date.now()}.apk`;

        cb(null, filename);

    }

});


const upload = multer({

    storage,

    limits: {
        fileSize: 1000 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        if (!file.originalname.toLowerCase().endsWith('.apk')) {
            return cb(new Error('Only APK files allowed'));
        }

        cb(null, true);

    }

}).single('apk');


/* =========================================================
   HELPERS
========================================================= */

function calculateChecksum(filePath) {

    return new Promise((resolve, reject) => {

        const hash = crypto.createHash('sha256');

        const stream = fs.createReadStream(filePath);

        stream.on('data', data => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);

    });

}


function parseJsonArray(value) {

    try {

        if (!value) return [];

        if (Array.isArray(value)) return value;

        const parsed = JSON.parse(value);

        return Array.isArray(parsed) ? parsed : [];

    } catch {

        return [];

    }

}


/* =========================================================
   UPLOAD APP VERSION
========================================================= */

router.post(
    '/',
    authenticateToken,
    requireAdmin,

    (req, res, next) => {

        upload(req, res, err => {

            if (err) {

                return res.status(400).json({
                    success: false,
                    error: err.message
                });

            }

            next();

        });

    },

    [

        check('version_name').isString().notEmpty(),
        check('version_code').isInt({ min: 1 }).toInt()

    ],

    async (req, res) => {

        const transaction = await db.sequelize.transaction();

        try {

            const errors = validationResult(req);

            if (!errors.isEmpty()) {

                if (req.file) await fs.remove(req.file.path);

                await transaction.rollback();

                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });

            }

            if (!req.file) {

                await transaction.rollback();

                return res.status(400).json({
                    success: false,
                    error: 'APK file missing'
                });

            }

            const {

                version_name,
                version_code,
                channel = 'stable',
                release_notes = '',
                is_required = false,
                min_sdk_version,
                rollout_percentage = 100,
                device_models,
                exclude_device_models,
                android_versions,
                regions,
                requires_wifi = false,
                requires_charging = false,
                requires_battery_level,
                tags,
                whats_new

            } = req.body;


            const existing = await AppUpdate.findOne({

                where: { version_code },
                transaction

            });


            if (existing) {

                await fs.remove(req.file.path);
                await transaction.rollback();

                return res.status(409).json({
                    success: false,
                    error: 'Version already exists'
                });

            }


            const checksum = await calculateChecksum(req.file.path);


            const update = await AppUpdate.create({

                id: uuidv4(),

                version: version_name,
                version_code,
                channel,

                file_path: req.file.path,
                file_name: req.file.originalname,
                file_size: req.file.size,

                checksum,

                release_notes,

                whats_new: parseJsonArray(whats_new),

                is_required,

                min_sdk_version,

                rollout_percentage,

                device_models: parseJsonArray(device_models),

                exclude_device_models: parseJsonArray(exclude_device_models),

                android_versions: parseJsonArray(android_versions),

                regions: parseJsonArray(regions),

                requires_wifi,
                requires_charging,

                requires_battery_level:
                    requires_battery_level
                        ? parseInt(requires_battery_level)
                        : null,

                tags: parseJsonArray(tags),

                uploaded_by: req.user.id,
                is_active: true,
                rollout_start_time: new Date()

            }, { transaction });


            await transaction.commit();


            logger.info('New OTA uploaded', {

                version: version_name,
                version_code

            });


            if (req.app.get('io')) {

                req.app.get('io').emit('app-update:new', {

                    version: version_name,
                    version_code

                });

            }


            res.status(201).json({

                success: true,
                update

            });


        } catch (error) {

            await transaction.rollback();

            logger.error('App upload error', error);

            if (req.file?.path) await fs.remove(req.file.path);

            res.status(500).json({

                success: false,
                error: 'Upload failed'

            });

        }

    }

);


/* =========================================================
   CHECK FOR UPDATE
========================================================= */

router.post(
    '/check',
    validateDeviceInfo,

    [

        check('device_id').notEmpty(),
        check('version_code').isInt()

    ],

    async (req, res) => {

        try {

            const { device_id, version_code } = req.body;


            const updates = await AppUpdate.findAll({

                where: {

                    version_code: { [Op.gt]: version_code },
                    is_active: true

                },

                order: [['version_code', 'DESC']]

            });


            if (!updates.length) {

                return res.json({
                    success: true,
                    update_available: false
                });

            }


            const update = updates[0];


            res.json({

                success: true,

                update_available: true,

                update: {

                    id: update.id,
                    version: update.version,
                    version_code: update.version_code,
                    download_url:
                        `${req.protocol}://${req.get('host')}/api/v2/app-updates/${update.id}/download`,
                    checksum: update.checksum,
                    file_size: update.file_size,
                    release_notes: update.release_notes,
                    is_required: update.is_required

                }

            });


        } catch (error) {

            logger.error('Update check error', error);

            res.status(500).json({
                success: false
            });

        }

    }

);


/* =========================================================
   DOWNLOAD APK
========================================================= */

router.get('/:id/download', async (req, res) => {

    try {

        const update = await AppUpdate.findByPk(req.params.id);

        if (!update) {

            return res.status(404).json({
                success: false
            });

        }

        if (!fs.existsSync(update.file_path)) {

            return res.status(404).json({
                success: false
            });

        }

        res.setHeader(
            'Content-Type',
            'application/vnd.android.package-archive'
        );

        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${update.file_name}"`
        );

        fs.createReadStream(update.file_path).pipe(res);

    } catch (error) {

        logger.error('Download error', error);

        res.status(500).json({
            success: false
        });

    }

});


/* =========================================================
   INSTALLATION REPORT
========================================================= */

router.post('/:id/report', async (req, res) => {

    const transaction = await db.sequelize.transaction();

    try {

        const { device_id, success, error } = req.body;

        const update = await AppUpdate.findByPk(req.params.id);

        if (!update) {

            await transaction.rollback();

            return res.status(404).json({
                success: false
            });

        }


        await AppInstallation.create({

            id: uuidv4(),

            update_id: update.id,
            device_id,

            success,
            error,

            created_at: new Date()

        }, { transaction });


        await transaction.commit();


        res.json({
            success: true
        });

    } catch (err) {

        await transaction.rollback();

        logger.error('Install report error', err);

        res.status(500).json({
            success: false
        });

    }

});


module.exports = router;