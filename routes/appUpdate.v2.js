const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { Op, Sequelize } = require('sequelize');
const { check, validationResult, query } = require('express-validator');
const { AppUpdate, Device, AppInstallation } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getFileChecksum, validateFileType } = require('../utils/fileUtils');
const { ROLES } = require('../config/constants');
const logger = require('../utils/logger');
const { validateDeviceInfo } = require('../middleware/deviceValidation');

// Configure multer for file uploads with enhanced validation
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/app-updates');
        fs.ensureDirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const versionCode = req.body.version_code || 'unknown';
        const versionName = (req.body.version_name || '0.0.0').replace(/\./g, '_');
        const channel = req.body.channel || 'stable';
        const timestamp = Date.now();
        const filename = `app-${versionCode}-${versionName}-${channel}-${timestamp}.apk`;
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: { 
        fileSize: 1000 * 1024 * 1024, // 1GB
        files: 1,
        fields: 20
    },
    fileFilter: async function (req, file, cb) {
        try {
            // Check file extension
            if (path.extname(file.originalname).toLowerCase() !== '.apk') {
                return cb(new Error('Only .apk files are allowed'));
            }
            
            // Additional file type validation
            const isApk = file.mimetype === 'application/vnd.android.package-archive' || 
                         file.originalname.toLowerCase().endsWith('.apk');
            
            if (!isApk) {
                return cb(new Error('Invalid APK file'));
            }
            
            cb(null, true);
        } catch (error) {
            cb(error);
        }
    }
}).single('apk');

// Helper function to calculate file checksum
const calculateChecksum = (filePath) => {
    return new Promise((resolve, reject) => {
        const hash = require('crypto').createHash('sha256');
        const stream = require('fs').createReadStream(filePath);
        
        stream.on('data', data => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
};

// Helper function to parse JSON array fields
const parseJsonArray = (str) => {
    try {
        if (!str) return [];
        if (Array.isArray(str)) return str;
        const parsed = JSON.parse(str);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
};

/**
 * @swagger
 * /api/v2/app-updates:
 *   post:
 *     summary: Upload a new app update
 *     tags: [App Updates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - apk
 *               - version_name
 *               - version_code
 *             properties:
 *               apk:
 *                 type: string
 *                 format: binary
 *               version_name:
 *                 type: string
 *                 example: 1.0.0
 *               version_code:
 *                 type: integer
 *                 example: 100
 *               channel:
 *                 type: string
 *                 enum: [stable, beta, alpha]
 *                 default: stable
 *               is_required:
 *                 type: boolean
 *                 default: false
 *               min_sdk_version:
 *                 type: integer
 *                 example: 21
 *               release_notes:
 *                 type: string
 *               whats_new:
 *                 type: string
 *                 description: JSON array of new features
 *               rollout_percentage:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 100
 *               device_models:
 *                 type: string
 *                 description: JSON array of device models to target
 *               exclude_device_models:
 *                 type: string
 *                 description: JSON array of device models to exclude
 *               android_versions:
 *                 type: string
 *                 description: JSON array of Android versions to target
 *               regions:
 *                 type: string
 *                 description: JSON array of regions to target
 *               requires_wifi:
 *                 type: boolean
 *                 default: false
 *               requires_charging:
 *                 type: boolean
 *                 default: false
 *               requires_battery_level:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               tags:
 *                 type: string
 *                 description: JSON array of tags
 *     responses:
 *       201:
 *         description: App update created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Version already exists
 *       500:
 *         description: Server error
 */
router.post('/', 
    authenticateToken,
    requireAdmin,
    (req, res, next) => {
        upload(req, res, function(err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ 
                    success: false,
                    error: `File upload error: ${err.message}`
                });
            } else if (err) {
                return res.status(400).json({ 
                    success: false,
                    error: err.message || 'Error uploading file'
                });
            }
            next();
        });
    },
    [
        check('version_name').isString().trim().notEmpty(),
        check('version_code').isInt({ min: 1 }).toInt(),
        check('channel').optional().isIn(['stable', 'beta', 'alpha']),
        check('is_required').optional().isBoolean().toBoolean(),
        check('min_sdk_version').isInt({ min: 1 }).toInt(),
        check('rollout_percentage').optional().isInt({ min: 1, max: 100 }).toInt(),
        check('requires_battery_level').optional().isInt({ min: 0, max: 100 }).toInt()
    ],
    async (req, res) => {
        const transaction = await AppUpdate.sequelize.transaction();
        
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                if (req.file) await fs.unlink(req.file.path).catch(console.error);
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
                    error: 'No APK file provided' 
                });
            }

            // Parse request body
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

            // Check if version already exists
            const existingVersion = await AppUpdate.findOne({
                where: {
                    version_code,
                    is_deleted: false
                },
                transaction
            });

            if (existingVersion) {
                await fs.unlink(req.file.path).catch(console.error);
                await transaction.rollback();
                return res.status(409).json({ 
                    success: false,
                    error: `Version code ${version_code} already exists` 
                });
            }

            // Calculate file checksum
            const checksum = await calculateChecksum(req.file.path);

            // Create new app version
            const newVersion = await AppUpdate.create({
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
                android_versions: parseJsonArray(android_versions).map(Number).filter(n => !isNaN(n)),
                regions: parseJsonArray(regions),
                requires_wifi: Boolean(requires_wifi),
                requires_charging: Boolean(requires_charging),
                requires_battery_level: requires_battery_level ? parseInt(requires_battery_level, 10) : null,
                tags: parseJsonArray(tags),
                is_active: true,
                uploaded_by: req.user.id,
                rollout_start_time: new Date()
            }, { transaction });

            await transaction.commit();

            logger.info('New app version uploaded', {
                version: version_name,
                version_code,
                fileSize: req.file.size,
                uploadedBy: req.user.id
            });

            // Notify connected clients via WebSocket
            if (req.app.get('io')) {
                req.app.get('io').emit('app-update:new', {
                    version: version_name,
                    version_code,
                    is_required,
                    channel
                });
            }

            return res.status(201).json({
                success: true,
                message: 'App version uploaded successfully',
                data: newVersion
            });

        } catch (error) {
            await transaction.rollback();
            
            logger.error('Error uploading app version:', {
                error: error.message,
                stack: error.stack,
                userId: req.user?.id,
                versionCode: req.body.version_code
            });
            
            // Clean up uploaded file if an error occurred
            if (req.file?.path) {
                await fs.unlink(req.file.path).catch(err => {
                    logger.error('Error cleaning up file:', { 
                        error: err.message,
                        file: req.file.path 
                    });
                });
            }
            
            const errorMessage = process.env.NODE_ENV === 'development' 
                ? error.message 
                : 'Failed to upload app version';
                
            return res.status(500).json({ 
                success: false,
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
);

/**
 * @swagger
 * /api/v2/app-updates/check:
 *   post:
 *     summary: Check for available updates
 *     tags: [App Updates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - device_id
 *               - version_code
 *             properties:
 *               device_id:
 *                 type: string
 *                 description: Unique device identifier
 *               version_code:
 *                 type: integer
 *                 description: Current app version code
 *               device_model:
 *                 type: string
 *                 description: Device model name
 *               android_version:
 *                 type: integer
 *                 description: Android SDK version
 *               region:
 *                 type: string
 *                 description: Device region/country code
 *               battery_level:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Current battery level
 *               is_charging:
 *                 type: boolean
 *                 description: Whether device is charging
 *               network_type:
 *                 type: string
 *                 enum: [wifi, mobile, ethernet, other]
 *                 description: Current network connection type
 *     responses:
 *       200:
 *         description: Update check response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 update_available:
 *                   type: boolean
 *                 update:
 *                   type: object
 *                   properties:
 *                     version:
 *                       type: string
 *                     version_code:
 *                       type: integer
 *                     is_required:
 *                       type: boolean
 *                     download_url:
 *                       type: string
 *                     file_size:
 *                       type: integer
 *                     checksum:
 *                       type: string
 *                     release_notes:
 *                       type: string
 *                     requires_wifi:
 *                       type: boolean
 *                     requires_charging:
 *                       type: boolean
 *                     requires_battery_level:
 *                       type: integer
 */
router.post('/check',
    validateDeviceInfo,
    [
        check('device_id').isString().trim().notEmpty(),
        check('version_code').isInt({ min: 1 }).toInt(),
        check('device_model').optional().isString().trim(),
        check('android_version').optional().isInt({ min: 1 }).toInt(),
        check('region').optional().isString().trim().isLength({ min: 2, max: 10 }),
        check('battery_level').optional().isInt({ min: 0, max: 100 }).toInt(),
        check('is_charging').optional().isBoolean().toBoolean(),
        check('network_type').optional().isIn(['wifi', 'mobile', 'ethernet', 'other'])
    ],
    async (req, res) => {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    success: false,
                    errors: errors.array() 
                });
            }

            const { 
                device_id, 
                version_code, 
                device_model, 
                android_version, 
                region,
                battery_level,
                is_charging,
                network_type
            } = req.body;

            // Find all potential updates
            const updates = await AppUpdate.findAll({
                where: {
                    version_code: { [Op.gt]: version_code },
                    is_active: true,
                    is_deleted: false,
                    [Op.or]: [
                        { rollout_start_time: { [Op.lte]: new Date() } },
                        { rollout_start_time: { [Op.is]: null } }
                    ]
                },
                order: [['version_code', 'DESC']]
            });

            if (updates.length === 0) {
                return res.json({ 
                    success: true,
                    update_available: false 
                });
            }

            // Find the best matching update based on device criteria
            const update = updates.find(update => {
                // Check if rollout is paused
                if (update.is_rollout_paused) return false;
                
                // Check device model targeting
                if (update.device_models?.length > 0 && 
                    device_model && 
                    !update.device_models.includes(device_model)) {
                    return false;
                }
                
                // Check excluded models
                if (update.exclude_device_models?.includes(device_model)) {
                    return false;
                }
                
                // Check Android version
                if (update.android_versions?.length > 0 && 
                    android_version && 
                    !update.android_versions.includes(android_version)) {
                    return false;
                }
                
                // Check region
                if (update.regions?.length > 0 && 
                    region && 
                    !update.regions.includes(region)) {
                    return false;
                }
                
                // Check battery requirements
                if (update.requires_battery_level && 
                    (battery_level === undefined || battery_level < update.requires_battery_level)) {
                    return false;
                }
                
                // Check charging requirement
                if (update.requires_charging && !is_charging) {
                    return false;
                }
                
                // Check network requirement
                if (update.requires_wifi && network_type !== 'wifi') {
                    return false;
                }
                
                // Check rollout percentage using consistent hashing
                if (update.rollout_percentage < 100) {
                    const hash = require('crypto')
                        .createHash('md5')
                        .update(device_id + update.id)
                        .digest('hex');
                    const hashValue = parseInt(hash.substring(0, 8), 16) / 0xffffffff;
                    return hashValue < (update.rollout_percentage / 100);
                }
                
                return true;
            });

            if (!update) {
                return res.json({ 
                    success: true,
                    update_available: false 
                });
            }

            // Prepare response
            const response = {
                success: true,
                update_available: true,
                update: {
                    version: update.version,
                    version_code: update.version_code,
                    is_required: update.is_required,
                    download_url: `${req.protocol}://${req.get('host')}/api/v2/app-updates/${update.id}/download`,
                    file_size: update.file_size,
                    checksum: update.checksum,
                    release_notes: update.release_notes,
                    requires_wifi: update.requires_wifi,
                    requires_charging: update.requires_charging,
                    requires_battery_level: update.requires_battery_level
                }
            };

            // Log the update check
            logger.info('Update check', {
                device_id,
                current_version: version_code,
                update_available: true,
                update_version: update.version_code
            });

            return res.json(response);

        } catch (error) {
            logger.error('Error checking for updates:', {
                error: error.message,
                stack: error.stack,
                deviceId: req.body.device_id
            });
            
            return res.status(500).json({
                success: false,
                error: 'Failed to check for updates',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

/**
 * @swagger
 * /api/v2/app-updates/{id}/download:
 *   get:
 *     summary: Download an app update
 *     tags: [App Updates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: App update ID
 *     responses:
 *       200:
 *         description: APK file download
 *         content:
 *           application/vnd.android.package-archive:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Update not found
 *       500:
 *         description: Server error
 */
router.get('/:id/download', async (req, res) => {
    try {
        const update = await AppUpdate.findOne({
            where: {
                id: req.params.id,
                is_active: true,
                is_deleted: false
            }
        });

        if (!update) {
            return res.status(404).json({
                success: false,
                error: 'Update not found'
            });
        }

        if (!fs.existsSync(update.file_path)) {
            return res.status(404).json({
                success: false,
                error: 'APK file not found'
            });
        }

        // Increment download count
        await update.increment('download_count', { silent: true });

        // Set headers for file download
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        res.setHeader('Content-Disposition', `attachment; filename="${update.file_name}"`);
        res.setHeader('Content-Length', update.file_size);
        res.setHeader('X-Checksum-SHA256', update.checksum);
        
        // Stream the file
        const fileStream = fs.createReadStream(update.file_path);
        fileStream.pipe(res);

        // Log the download
        logger.info('APK download', {
            update_id: update.id,
            version: update.version,
            version_code: update.version_code,
            file_size: update.file_size
        });

    } catch (error) {
        logger.error('Error downloading APK:', {
            error: error.message,
            stack: error.stack,
            updateId: req.params.id
        });
        
        res.status(500).json({
            success: false,
            error: 'Failed to download update',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/v2/app-updates/{id}/report:
 *   post:
 *     summary: Report installation status
 *     tags: [App Updates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: App update ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - device_id
 *               - success
 *             properties:
 *               device_id:
 *                 type: string
 *                 description: Unique device identifier
 *               success:
 *                 type: boolean
 *                 description: Whether installation was successful
 *               error:
 *                 type: string
 *                 description: Error details if installation failed
 *               device_info:
 *                 type: object
 *                 description: Additional device information
 *     responses:
 *       200:
 *         description: Installation reported successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Update not found
 *       500:
 *         description: Server error
 */
router.post('/:id/report',
    [
        check('device_id').isString().trim().notEmpty(),
        check('success').isBoolean(),
        check('error').optional().isString(),
        check('device_info').optional().isObject()
    ],
    async (req, res) => {
        const transaction = await AppUpdate.sequelize.transaction();
        
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                await transaction.rollback();
                return res.status(400).json({ 
                    success: false,
                    errors: errors.array() 
                });
            }

            const { device_id, success, error, device_info } = req.body;
            const updateId = req.params.id;

            // Find the update
            const update = await AppUpdate.findByPk(updateId, { transaction });
            if (!update) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    error: 'Update not found'
                });
            }

            // Update installation stats
            if (success) {
                update.installed_count += 1;
                update.last_installed = new Date();
            } else {
                update.failed_count += 1;
            }

            // Calculate success rate
            const total = update.installed_count + update.failed_count;
            update.success_rate = total > 0 ? (update.installed_count / total) * 100 : 0;

            await update.save({ transaction });

            // Create installation record
            await AppInstallation.create({
                id: uuidv4(),
                update_id: updateId,
                device_id,
                success,
                error: error || null,
                device_info: device_info || {},
                created_at: new Date()
            }, { transaction });

            await transaction.commit();

            logger.info('Installation reported', {
                update_id: updateId,
                device_id,
                success,
                error: error || null
            });

            return res.json({
                success: true,
                message: 'Installation reported successfully'
            });

        } catch (error) {
            await transaction.rollback();
            
            logger.error('Error reporting installation:', {
                error: error.message,
                stack: error.stack,
                updateId: req.params.id,
                deviceId: req.body.device_id
            });
            
            return res.status(500).json({
                success: false,
                error: 'Failed to report installation',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

module.exports = router;
