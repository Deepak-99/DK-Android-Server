const { Media, Device } = require('../../../models');
const { Op } = require('sequelize');
const logger = require('../../../utils/logger');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const mime = require('mime-types');
const { createReadStream, createWriteStream } = require('fs');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline);
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configure upload directory
const UPLOAD_DIR = process.env.MEDIA_UPLOAD_DIR || path.join(__dirname, '../../../uploads/media');
const THUMBNAIL_DIR = path.join(UPLOAD_DIR, 'thumbnails');
const PROCESSED_DIR = path.join(UPLOAD_DIR, 'processed');

// Ensure upload directories exist
const ensureDirectories = async () => {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(THUMBNAIL_DIR, { recursive: true });
    await fs.mkdir(PROCESSED_DIR, { recursive: true });
};

// Initialize directories on startup
ensureDirectories().catch(err => {
    logger.error('Failed to create upload directories:', err);
});

/**
 * Sync media files from device to server
 */
exports.syncMedia = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { files } = req.body;
        const requestId = req.requestId || 'unknown';

        // Validate input
        if (!Array.isArray(files)) {
            return res.status(400).json({
                success: false,
                error: 'Files must be an array'
            });
        }

        // Check if device exists
        const device = await Device.findByPk(deviceId);
        if (!device) {
            return res.status(404).json({
                success: false,
                error: 'Device not found'
            });
        }

        // Process files
        const results = {
            created: 0,
            updated: 0,
            failed: 0,
            errors: []
        };

        for (const file of files) {
            try {
                const { created } = await processMediaFile(deviceId, file);
                if (created) results.created++;
                else results.updated++;
            } catch (error) {
                results.failed++;
                results.errors.push(error.message);
                logger.error(`[${requestId}] Error processing media file:`, error);
            }
        }

        logger.info(`[${requestId}] Synced ${files.length} media files for device ${deviceId}: ${results.created} created, ${results.updated} updated, ${results.failed} failed`);

        return res.json({
            success: true,
            data: results
        });

    } catch (error) {
        logger.error('Error syncing media files:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to sync media files',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Process a single media file (create or update)
 */
async function processMediaFile(deviceId, file) {
    // Validate required fields
    if (!file.id || !file.path || !file.type || !file.size || !file.mimeType) {
        throw new Error('Missing required file fields');
    }

    const filePath = path.join(UPLOAD_DIR, file.path);
    const fileDir = path.dirname(filePath);
    
    // Ensure directory exists
    await fs.mkdir(fileDir, { recursive: true });

    // Save file if content is provided
    if (file.content) {
        const content = Buffer.from(file.content, 'base64');
        await fs.writeFile(filePath, content);
    }

    // Generate thumbnail if it's an image or video
    let thumbnailPath = null;
    if (file.mimeType.startsWith('image/')) {
        thumbnailPath = await generateImageThumbnail(filePath, file.id);
    } else if (file.mimeType.startsWith('video/')) {
        thumbnailPath = await generateVideoThumbnail(filePath, file.id);
    }

    // Create or update media record
    const [media, created] = await Media.findOrCreate({
        where: {
            deviceId,
            path: file.path
        },
        defaults: {
            id: uuidv4(),
            deviceId,
            type: file.type, // 'image', 'video', 'audio', 'document', etc.
            mimeType: file.mimeType,
            size: file.size,
            width: file.width,
            height: file.height,
            duration: file.duration,
            thumbnailPath: thumbnailPath ? path.relative(UPLOAD_DIR, thumbnailPath) : null,
            metadata: file.metadata || {},
            isHidden: file.isHidden || false,
            isFavorite: file.isFavorite || false,
            capturedAt: file.capturedAt || new Date()
        }
    });

    if (!created) {
        await media.update({
            size: file.size,
            width: file.width,
            height: file.height,
            duration: file.duration,
            metadata: file.metadata || media.metadata,
            isHidden: file.isHidden !== undefined ? file.isHidden : media.isHidden,
            isFavorite: file.isFavorite !== undefined ? file.isFavorite : media.isFavorite,
            capturedAt: file.capturedAt || media.capturedAt
        });
    }

    return { media, created };
}

/**
 * Generate thumbnail for image
 */
async function generateImageThumbnail(imagePath, fileId) {
    const thumbnailPath = path.join(THUMBNAIL_DIR, `${fileId}.jpg`);
    
    try {
        await sharp(imagePath)
            .resize(200, 200, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);
            
        return thumbnailPath;
    } catch (error) {
        logger.error('Error generating image thumbnail:', error);
        return null;
    }
}

/**
 * Generate thumbnail for video
 */
async function generateVideoThumbnail(videoPath, fileId) {
    const thumbnailPath = path.join(THUMBNAIL_DIR, `${fileId}.jpg`);
    
    try {
        await new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .screenshots({
                    timestamps: ['10%'],
                    filename: `${fileId}.jpg`,
                    folder: THUMBNAIL_DIR,
                    size: '320x240'
                })
                .on('end', resolve)
                .on('error', reject);
        });
        
        return thumbnailPath;
    } catch (error) {
        logger.error('Error generating video thumbnail:', error);
        return null;
    }
}

/**
 * Get media files with filtering and pagination
 */
exports.getMediaFiles = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { 
            type,
            mimeType,
            minSize,
            maxSize,
            startDate,
            endDate,
            isHidden,
            isFavorite,
            search,
            page = 1,
            limit = 50
        } = req.query;

        // Build where clause
        const where = { deviceId };
        
        // Filter by type
        if (type) {
            where.type = type;
        }

        // Filter by MIME type
        if (mimeType) {
            where.mimeType = { [Op.like]: `${mimeType}%` };
        }

        // Filter by size
        if (minSize || maxSize) {
            where.size = {};
            if (minSize) where.size[Op.gte] = parseInt(minSize);
            if (maxSize) where.size[Op.lte] = parseInt(maxSize);
        }

        // Filter by date
        if (startDate || endDate) {
            where.capturedAt = {};
            if (startDate) where.capturedAt[Op.gte] = new Date(startDate);
            if (endDate) where.capturedAt[Op.lte] = new Date(endDate);
        }

        // Filter by flags
        if (isHidden !== undefined) {
            where.isHidden = isHidden === 'true';
        }

        if (isFavorite !== undefined) {
            where.isFavorite = isFavorite === 'true';
        }

        // Search in path or metadata
        if (search) {
            where[Op.or] = [
                { path: { [Op.like]: `%${search}%` } },
                { '$metadata.tags$': { [Op.like]: `%${search}%` } }
            ];
        }

        // Execute query with pagination
        const { count, rows } = await Media.findAndCountAll({
            where,
            order: [['capturedAt', 'DESC']],
            limit: parseInt(limit),
            offset: (page - 1) * limit
        });

        // Generate URLs for the files
        const files = rows.map(media => ({
            ...media.toJSON(),
            url: `/api/v1/media/${deviceId}/file/${encodeURIComponent(media.path)}`,
            thumbnailUrl: media.thumbnailPath 
                ? `/api/v1/media/${deviceId}/thumbnail/${encodeURIComponent(media.thumbnailPath)}` 
                : null
        }));

        return res.json({
            success: true,
            data: files,
            pagination: {
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        logger.error('Error fetching media files:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch media files'
        });
    }
};

/**
 * Stream media file
 */
exports.streamMedia = async (req, res) => {
    try {
        const { deviceId, filePath } = req.params;
        
        // Validate file path to prevent directory traversal
        if (filePath.includes('..') || path.isAbsolute(filePath)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid file path'
            });
        }

        const fullPath = path.join(UPLOAD_DIR, filePath);
        
        // Check if file exists
        try {
            await fs.access(fullPath);
        } catch (err) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        // Get file stats
        const stats = await fs.stat(fullPath);
        const fileSize = stats.size;
        const range = req.headers.range;

        // Set content type
        const contentType = mime.lookup(fullPath) || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);

        // Handle range requests for video/audio streaming
        if (range && (contentType.startsWith('video/') || contentType.startsWith('audio/'))) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = (end - start) + 1;
            
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize
            });

            const fileStream = createReadStream(fullPath, { start, end });
            return fileStream.pipe(res);
        } else {
            // For non-range requests or non-media files
            res.setHeader('Content-Length', fileSize);
            const fileStream = createReadStream(fullPath);
            return fileStream.pipe(res);
        }

    } catch (error) {
        logger.error('Error streaming media file:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to stream media file'
        });
    }
};

/**
 * Serve thumbnail
 */
exports.serveThumbnail = async (req, res) => {
    try {
        const { deviceId, thumbnailPath } = req.params;
        
        // Validate thumbnail path
        if (thumbnailPath.includes('..') || path.isAbsolute(thumbnailPath)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid thumbnail path'
            });
        }

        const fullPath = path.join(UPLOAD_DIR, thumbnailPath);
        
        // Check if file exists
        try {
            await fs.access(fullPath);
        } catch (err) {
            // Return a default thumbnail if not found
            return res.sendFile(path.join(__dirname, '../../../public/default-thumbnail.png'));
        }

        // Set cache headers (1 day)
        const oneDay = 86400000;
        res.setHeader('Cache-Control', `public, max-age=${oneDay / 1000}`);
        res.setHeader('Expires', new Date(Date.now() + oneDay).toUTCString());
        
        return res.sendFile(fullPath);

    } catch (error) {
        logger.error('Error serving thumbnail:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to serve thumbnail'
        });
    }
};

/**
 * Delete media files
 */
exports.deleteMedia = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { fileIds, all = false } = req.body;

        // Validate input
        if (!all && (!Array.isArray(fileIds) || fileIds.length === 0)) {
            return res.status(400).json({
                success: false,
                error: 'Either fileIds or all=true must be provided'
            });
        }

        // Build where clause
        const where = { deviceId };
        if (!all) {
            where.id = { [Op.in]: fileIds };
        }

        // Get files to be deleted
        const files = await Media.findAll({ where });
        
        // Delete files from storage
        for (const file of files) {
            try {
                // Delete main file
                const filePath = path.join(UPLOAD_DIR, file.path);
                await fs.unlink(filePath).catch(() => {});
                
                // Delete thumbnail if exists
                if (file.thumbnailPath) {
                    const thumbPath = path.join(UPLOAD_DIR, file.thumbnailPath);
                    await fs.unlink(thumbPath).catch(() => {});
                }
            } catch (error) {
                logger.error(`Error deleting file ${file.path}:`, error);
            }
        }

        // Delete database records
        const deletedCount = await Media.destroy({ where });

        return res.json({
            success: true,
            message: `Deleted ${deletedCount} media files`
        });

    } catch (error) {
        logger.error('Error deleting media files:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete media files'
        });
    }
};

/**
 * Update media metadata
 */
exports.updateMedia = async (req, res) => {
    try {
        const { deviceId, fileId } = req.params;
        const updates = req.body;

        // Find the media file
        const media = await Media.findOne({
            where: { id: fileId, deviceId }
        });

        if (!media) {
            return res.status(404).json({
                success: false,
                error: 'Media file not found'
            });
        }

        // Update allowed fields
        const allowedUpdates = [
            'isHidden', 'isFavorite', 'metadata', 'capturedAt'
        ];

        for (const field of allowedUpdates) {
            if (updates[field] !== undefined) {
                media[field] = updates[field];
            }
        }

        await media.save();

        return res.json({
            success: true,
            data: media
        });

    } catch (error) {
        logger.error('Error updating media file:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update media file'
        });
    }
};

/**
 * Get media statistics
 */
exports.getMediaStatistics = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { startDate, endDate } = req.query;

        // Build where clause
        const where = { deviceId };
        if (startDate || endDate) {
            where.capturedAt = {};
            if (startDate) where.capturedAt[Op.gte] = new Date(startDate);
            if (endDate) where.capturedAt[Op.lte] = new Date(endDate);
        }

        // Get all media files
        const mediaFiles = await Media.findAll({ where, raw: true });

        // Calculate statistics
        const stats = {
            totalFiles: mediaFiles.length,
            totalSize: 0,
            byType: {},
            byMimeType: {},
            byDate: {},
            hiddenCount: 0,
            favoriteCount: 0
        };

        mediaFiles.forEach(file => {
            // Calculate total size
            stats.totalSize += file.size || 0;

            // Count by type
            stats.byType[file.type] = (stats.byType[file.type] || 0) + 1;

            // Count by MIME type
            const mimeType = file.mimeType.split('/')[0];
            stats.byMimeType[mimeType] = (stats.byMimeType[mimeType] || 0) + 1;

            // Group by date
            const date = new Date(file.capturedAt).toISOString().split('T')[0];
            stats.byDate[date] = (stats.byDate[date] || 0) + 1;

            // Count hidden and favorite
            if (file.isHidden) stats.hiddenCount++;
            if (file.isFavorite) stats.favoriteCount++;
        });

        // Convert size to human-readable format
        stats.totalSizeFormatted = formatFileSize(stats.totalSize);

        return res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        logger.error('Error fetching media statistics:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch media statistics'
        });
    }
};

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Upload media file
 */
exports.uploadMedia = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const file = req.file;
        const { type, metadata } = req.body;

        if (!file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        // Generate unique filename
        const fileExt = path.extname(file.originalname);
        const fileName = `${uuidv4()}${fileExt}`;
        const relativePath = path.join('uploads', new Date().toISOString().split('T')[0], fileName);
        const filePath = path.join(UPLOAD_DIR, relativePath);

        // Ensure directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });

        // Move uploaded file to destination
        await fs.rename(file.path, filePath);

        // Get file stats
        const stats = await fs.stat(filePath);
        const mimeType = mime.lookup(filePath) || 'application/octet-stream';

        // Create media record
        const media = await Media.create({
            id: uuidv4(),
            deviceId,
            path: relativePath,
            type: type || mimeType.split('/')[0],
            mimeType,
            size: stats.size,
            metadata: metadata ? JSON.parse(metadata) : {},
            isHidden: false,
            isFavorite: false,
            capturedAt: new Date()
        });

        // Generate thumbnail if it's an image or video
        if (mimeType.startsWith('image/')) {
            const thumbnailPath = await generateImageThumbnail(filePath, media.id);
            if (thumbnailPath) {
                media.thumbnailPath = path.relative(UPLOAD_DIR, thumbnailPath);
                await media.save();
            }
        } else if (mimeType.startsWith('video/')) {
            const thumbnailPath = await generateVideoThumbnail(filePath, media.id);
            if (thumbnailPath) {
                media.thumbnailPath = path.relative(UPLOAD_DIR, thumbnailPath);
                await media.save();
            }
        }

        return res.status(201).json({
            success: true,
            data: {
                ...media.toJSON(),
                url: `/api/v1/media/${deviceId}/file/${encodeURIComponent(media.path)}`,
                thumbnailUrl: media.thumbnailPath 
                    ? `/api/v1/media/${deviceId}/thumbnail/${encodeURIComponent(media.thumbnailPath)}` 
                    : null
            }
        });

    } catch (error) {
        logger.error('Error uploading media file:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to upload media file',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Search media files
 */
exports.searchMedia = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { query, type, startDate, endDate, page = 1, limit = 50 } = req.query;

        // Build where clause
        const where = { deviceId };

        // Filter by type
        if (type) {
            where.type = type;
        }

        // Filter by date
        if (startDate || endDate) {
            where.capturedAt = {};
            if (startDate) where.capturedAt[Op.gte] = new Date(startDate);
            if (endDate) where.capturedAt[Op.lte] = new Date(endDate);
        }

        // Search in path or metadata
        if (query) {
            where[Op.or] = [
                { path: { [Op.like]: `%${query}%` } },
                { '$metadata.tags$': { [Op.like]: `%${query}%` } },
                { '$metadata.description$': { [Op.like]: `%${query}%` } }
            ];
        }

        // Execute query with pagination
        const { count, rows } = await Media.findAndCountAll({
            where,
            order: [['capturedAt', 'DESC']],
            limit: parseInt(limit),
            offset: (page - 1) * limit
        });

        // Generate URLs for the files
        const files = rows.map(media => ({
            ...media.toJSON(),
            url: `/api/v1/media/${deviceId}/file/${encodeURIComponent(media.path)}`,
            thumbnailUrl: media.thumbnailPath 
                ? `/api/v1/media/${deviceId}/thumbnail/${encodeURIComponent(media.thumbnailPath)}` 
                : null
        }));

        return res.json({
            success: true,
            data: files,
            pagination: {
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        logger.error('Error searching media files:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to search media files'
        });
    }
};