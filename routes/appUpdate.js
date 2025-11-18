const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { AppUpdate, Device } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Configure multer for APK uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/apk');
        fs.ensureDirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const versionCode = req.body.version_code || 'unknown';
        const versionName = (req.body.version_name || '0.0.0').replace(/\./g, '_');
        const timestamp = Date.now();
        const filename = `hawkshaw-${versionCode}-${versionName}-${timestamp}.apk`;
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: { 
        fileSize: 100 * 1024 * 1024, // 100MB
        files: 1
    },
    fileFilter: async function (req, file, cb) {
        try {
            // Check file extension
            if (path.extname(file.originalname).toLowerCase() !== '.apk') {
                return cb(new Error('Only .apk files are allowed'));
            }
            
            // Additional file type validation using magic numbers
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
});

// Calculate file checksum
const calculateChecksum = (filePath) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        
        stream.on('data', data => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
};

/**
 * @swagger
 * /api/app-updates/upload:
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
 *                 description: The APK file to upload
 *               version_name:
 *                 type: string
 *                 description: Version name (e.g., 1.0.0)
 *               version_code:
 *                 type: integer
 *                 description: Version code (must be unique and incrementing)
 *               channel:
 *                 type: string
 *                 enum: [stable, beta, alpha]
 *                 default: stable
 *                 description: Release channel
 *               is_mandatory:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this update is mandatory
 *               min_supported_version:
 *                 type: integer
 *                 description: Minimum supported version code
 *               release_notes:
 *                 type: string
 *                 description: Detailed release notes
 *               whats_new:
 *                 type: string
 *                 description: JSON array of new features/changes
 *               rollout_percentage:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 100
 *                 description: Percentage of users to receive this update
 *               device_models:
 *                 type: string
 *                 description: JSON array of specific device models to target
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
 *                 description: Whether update requires WiFi
 *               requires_charging:
 *                 type: boolean
 *                 default: false
 *                 description: Whether device needs to be charging
 *               requires_battery_level:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Minimum battery level required
 *               tags:
 *                 type: string
 *                 description: JSON array of tags for categorization
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
router.post('/upload', 
    authenticateToken, 
    upload.single('apk'), 
    [
        check('version_name').isString().trim().notEmpty(),
        check('version_code').isInt({ min: 1 }).toInt(),
        check('channel').optional().isIn(['stable', 'beta', 'alpha']),
        check('is_mandatory').optional().isBoolean().toBoolean(),
        check('rollout_percentage').optional().isInt({ min: 1, max: 100 }).toInt(),
        check('requires_battery_level').optional().isInt({ min: 0, max: 100 }).toInt()
    ],
    async (req, res) => {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                if (req.file) await fs.unlink(req.file.path).catch(console.error);
                return res.status(400).json({ errors: errors.array() });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'No APK file provided' });
            }

            // Parse request body
            const {
                version_name,
                version_code,
                channel = 'stable',
                release_notes = '',
                is_mandatory = false,
                min_supported_version,
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
                    version_code: version_code,
                    is_deleted: false
                }
            });

            if (existingVersion) {
                await fs.unlink(req.file.path).catch(console.error);
                return res.status(409).json({ 
                    error: `Version code ${version_code} already exists` 
                });
            }

            // Parse JSON array fields
            const parseJsonArray = (str) => {
                try {
                    return str ? JSON.parse(str) : [];
                } catch (e) {
                    return [];
                }
            };

            // Calculate file checksum
            const checksum = await calculateChecksum(req.file.path);

            // Create transaction for atomic operations
            const transaction = await sequelize.transaction();

            try {
                // Create new app version
                const newVersion = await AppUpdate.create({
                    id: uuidv4(),
                    version: version_name,
                    version_code: version_code,
                    channel: channel,
                    file_path: req.file.path,
                    file_name: req.file.originalname,
                    file_size: req.file.size,
                    checksum: checksum,
                    release_notes: release_notes,
                    whats_new: parseJsonArray(whats_new),
                    is_required: is_mandatory,
                    min_supported_version: min_supported_version || null,
                    rollout_percentage: parseInt(rollout_percentage, 10),
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

        // Emit socket event for real-time updates
        if (req.app.get('io')) {
            req.app.get('io').emit('appUpdateUploaded', {
                id: appUpdate.id,
                version_name: appUpdate.version_name,
                version_code: appUpdate.version_code,
                file_size: appUpdate.apk_file_size,
                upload_date: appUpdate.upload_date
            });
        }

        res.json({
            success: true,
            message: 'APK uploaded successfully',
            update: {
                id: appUpdate.id,
                version_name: appUpdate.version_name,
                version_code: appUpdate.version_code,
                file_size: appUpdate.apk_file_size,
                checksum: appUpdate.apk_checksum,
                upload_date: appUpdate.upload_date
            }
        });

    } catch (error) {
        console.error('Error uploading APK:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path); // Clean up on error
        }
        res.status(500).json({ error: 'Failed to upload APK' });
    }
});

// Check for updates (used by Android app)
router.post('/check', async (req, res) => {
    try {
        const { device_id, current_version_code } = req.body;

        if (!device_id || current_version_code === undefined) {
            return res.status(400).json({ error: 'Device ID and current version code are required' });
        }

        // Find available update for this device
        const availableUpdate = await AppUpdate.getAvailableUpdate(
            parseInt(current_version_code),
            device_id
        );

        if (!availableUpdate) {
            return res.json({
                update_available: false,
                message: 'No update available'
            });
        }

        res.json({
            update_available: true,
            version_name: availableUpdate.version_name,
            version_code: availableUpdate.version_code,
            file_size: availableUpdate.apk_file_size,
            checksum: availableUpdate.apk_checksum,
            release_notes: availableUpdate.release_notes,
            is_mandatory: availableUpdate.is_mandatory,
            download_url: `/api/app-update/download/${availableUpdate.id}`
        });

    } catch (error) {
        console.error('Error checking for updates:', error);
        res.status(500).json({ error: 'Failed to check for updates' });
    }
});

// Download APK
router.get('/download/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { device_id } = req.query;

        const appUpdate = await AppUpdate.findByPk(id);
        if (!appUpdate || !appUpdate.is_active) {
            return res.status(404).json({ error: 'Update not found or not available' });
        }

        // Check if file exists
        if (!fs.existsSync(appUpdate.apk_file_path)) {
            return res.status(404).json({ error: 'APK file not found on server' });
        }

        // Increment download count
        await appUpdate.incrementDownloadCount();

        // Emit socket event
        if (req.app.get('io')) {
            req.app.get('io').emit('appUpdateDownloaded', {
                id: appUpdate.id,
                version_name: appUpdate.version_name,
                device_id: device_id,
                download_count: appUpdate.download_count
            });
        }

        // Set appropriate headers
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        res.setHeader('Content-Disposition', `attachment; filename="${appUpdate.apk_file_name}"`);
        res.setHeader('Content-Length', appUpdate.apk_file_size);

        // Stream the file
        const fileStream = fs.createReadStream(appUpdate.apk_file_path);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Error downloading APK:', error);
        res.status(500).json({ error: 'Failed to download APK' });
    }
});

// Report successful installation (called by Android app)
router.post('/install-report', async (req, res) => {
    try {
        const { device_id, version_code, success, error_message } = req.body;

        if (!device_id || version_code === undefined) {
            return res.status(400).json({ error: 'Device ID and version code are required' });
        }

        const appUpdate = await AppUpdate.findOne({
            where: { version_code: parseInt(version_code) }
        });

        if (appUpdate && success) {
            await appUpdate.incrementInstallCount();
        }

        // Update device version if successful
        if (success) {
            await Device.update(
                { app_version: version_code },
                { where: { device_id: device_id } }
            );
        }

        // Emit socket event
        if (req.app.get('io')) {
            req.app.get('io').emit('appInstallReport', {
                device_id,
                version_code,
                success,
                error_message,
                install_count: appUpdate?.install_count
            });
        }

        res.json({ success: true, message: 'Installation report received' });

    } catch (error) {
        console.error('Error processing install report:', error);
        res.status(500).json({ error: 'Failed to process install report' });
    }
});

// Get all app updates (admin)
router.get('/list', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const updates = await AppUpdate.getUpdateHistory(parseInt(limit), offset);
        const stats = await AppUpdate.getUpdateStats();

        res.json({
            success: true,
            updates,
            stats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: stats.totalVersions
            }
        });

    } catch (error) {
        console.error('Error fetching app updates:', error);
        res.status(500).json({ error: 'Failed to fetch app updates' });
    }
});

// Update app version settings
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            is_active,
            is_mandatory,
            rollout_percentage,
            target_devices,
            release_notes
        } = req.body;

        const appUpdate = await AppUpdate.findByPk(id);
        if (!appUpdate) {
            return res.status(404).json({ error: 'App update not found' });
        }

        // Update fields
        const updateData = {};
        if (is_active !== undefined) updateData.is_active = is_active;
        if (is_mandatory !== undefined) updateData.is_mandatory = is_mandatory;
        if (rollout_percentage !== undefined) updateData.rollout_percentage = rollout_percentage;
        if (target_devices !== undefined) updateData.target_devices = target_devices;
        if (release_notes !== undefined) updateData.release_notes = release_notes;

        await appUpdate.update(updateData);

        // Emit socket event
        if (req.app.get('io')) {
            req.app.get('io').emit('appUpdateModified', {
                id: appUpdate.id,
                version_name: appUpdate.version_name,
                changes: updateData
            });
        }

        res.json({
            success: true,
            message: 'App update settings updated',
            update: appUpdate
        });

    } catch (error) {
        console.error('Error updating app version:', error);
        res.status(500).json({ error: 'Failed to update app version' });
    }
});

// Delete app update
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const appUpdate = await AppUpdate.findByPk(id);
        if (!appUpdate) {
            return res.status(404).json({ error: 'App update not found' });
        }

        // Soft delete
        await appUpdate.destroy();

        // Optionally delete the APK file
        if (fs.existsSync(appUpdate.apk_file_path)) {
            fs.unlinkSync(appUpdate.apk_file_path);
        }

        // Emit socket event
        if (req.app.get('io')) {
            req.app.get('io').emit('appUpdateDeleted', {
                id: appUpdate.id,
                version_name: appUpdate.version_name
            });
        }

        res.json({
            success: true,
            message: 'App update deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting app update:', error);
        res.status(500).json({ error: 'Failed to delete app update' });
    }
});

// Get update statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const stats = await AppUpdate.getUpdateStats();
        const latestVersion = await AppUpdate.getLatestVersion();

        res.json({
            success: true,
            stats: {
                ...stats,
                latestVersion: latestVersion ? {
                    version_name: latestVersion.version_name,
                    version_code: latestVersion.version_code,
                    upload_date: latestVersion.upload_date
                } : null
            }
        });

    } catch (error) {
        console.error('Error fetching update stats:', error);
        res.status(500).json({ error: 'Failed to fetch update stats' });
    }
});

// Force update command for specific device
router.post('/force-update', authenticateToken, async (req, res) => {
    try {
        const { device_id, version_code } = req.body;

        if (!device_id) {
            return res.status(400).json({ error: 'Device ID is required' });
        }

        // Find target version or latest
        let targetUpdate;
        if (version_code) {
            targetUpdate = await AppUpdate.findOne({
                where: { version_code: parseInt(version_code), is_active: true }
            });
        } else {
            targetUpdate = await AppUpdate.getLatestVersion();
        }

        if (!targetUpdate) {
            return res.status(404).json({ error: 'Target update version not found' });
        }

        // Send update command to device
        const updateCommand = {
            type: 'ForceAppUpdate',
            data: {
                version_name: targetUpdate.version_name,
                version_code: targetUpdate.version_code,
                download_url: `/api/app-update/download/${targetUpdate.id}`,
                checksum: targetUpdate.apk_checksum,
                is_mandatory: true
            }
        };

        // Emit command to specific device
        if (req.app.get('io')) {
            req.app.get('io').to(device_id).emit('command', updateCommand);
        }

        res.json({
            success: true,
            message: 'Force update command sent to device',
            target_version: targetUpdate.version_name
        });

    } catch (error) {
        console.error('Error sending force update:', error);
        res.status(500).json({ error: 'Failed to send force update command' });
    }
});

module.exports = router;
