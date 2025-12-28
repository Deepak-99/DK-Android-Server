// utils/storage.js
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

// Ensure upload directories exist
const uploadDirs = {
    callRecordings: path.join(config.uploadDir, 'call-recordings'),
    screenRecordings: path.join(config.uploadDir, 'screen-recordings'),
    screenshots: path.join(config.uploadDir, 'screenshots'),
    thumbnails: path.join(config.uploadDir, 'thumbnails')
};

// Create directories if they don't exist
Object.values(uploadDirs).forEach(dir => {
    fs.ensureDirSync(dir);
});

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = '';

        // Determine upload directory based on file type
        if (file.fieldname === 'callRecording') {
            uploadPath = uploadDirs.callRecordings;
        } else if (file.fieldname === 'screenRecording') {
            uploadPath = uploadDirs.screenRecordings;
        } else if (file.fieldname === 'screenshot') {
            uploadPath = uploadDirs.screenshots;
        } else if (file.fieldname === 'thumbnail') {
            uploadPath = uploadDirs.thumbnails;
        } else {
            return cb(new Error('Invalid file type'));
        }

        // Ensure the directory exists
        fs.ensureDirSync(uploadPath);
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate a unique filename with original extension
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Accept files based on fieldname
    if (
        (file.fieldname === 'callRecording' && file.mimetype.startsWith('audio/')) ||
        ((file.fieldname === 'screenRecording' || file.fieldname === 'screenshot') &&
            file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) ||
        (file.fieldname === 'thumbnail' && file.mimetype.startsWith('image/'))
    ) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'), false);
    }
};

// Configure multer upload
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 100, // 100MB max file size
        files: 1
    }
});

// Middleware for specific upload types
const uploadCallRecording = upload.single('callRecording');
const uploadScreenRecording = upload.single('screenRecording');
const uploadScreenshot = upload.single('screenshot');
const uploadThumbnail = upload.single('thumbnail');

// Helper functions for file operations
const storageUtils = {
    // Get file path
    getFilePath: (type, filename) => {
        const baseDir = {
            callRecording: uploadDirs.callRecordings,
            screenRecording: uploadDirs.screenRecordings,
            screenshot: uploadDirs.screenshots,
            thumbnail: uploadDirs.thumbnails
        }[type];

        return baseDir ? path.join(baseDir, filename) : null;
    },

    // Delete file
    deleteFile: async (filePath) => {
        try {
            if (filePath && await fs.pathExists(filePath)) {
                await fs.unlink(filePath);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    },

    // Clean up old files
    cleanupOldFiles: async (type, maxAge = 30 * 24 * 60 * 60 * 1000) => {
        const dir = uploadDirs[type] || uploadDirs[type + 's']; // Handle plural/singular
        if (!dir) return;

        try {
            const files = await fs.readdir(dir);
            const now = Date.now();

            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = await fs.stat(filePath);

                if (now - stat.mtimeMs > maxAge) {
                    await fs.unlink(filePath);
                    console.log(`Deleted old file: ${filePath}`);
                }
            }
        } catch (error) {
            console.error(`Error cleaning up ${type} files:`, error);
        }
    }
};

module.exports = {
    uploadCallRecording,
    uploadScreenRecording,
    uploadScreenshot,
    uploadThumbnail,
    ...storageUtils
};