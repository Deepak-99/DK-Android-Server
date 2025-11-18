const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const logger = require('./logger');

/**
 * Validates if a file is of the specified type
 * @param {Object} file - Multer file object
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @param {string[]} allowedExtensions - Array of allowed file extensions (with .)
 * @returns {boolean} - Whether the file is valid
 */
const validateFileType = (file, allowedTypes, allowedExtensions) => {
    // Check MIME type
    const mimeTypeValid = !allowedTypes || allowedTypes.includes(file.mimetype);
    
    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    const extValid = !allowedExtensions || allowedExtensions.includes(ext);
    
    return mimeTypeValid && extValid;
};

/**
 * Calculates the SHA-256 checksum of a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} - Hex-encoded checksum
 */
const getFileChecksum = (filePath) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        
        stream.on('data', data => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
};

/**
 * Safely deletes a file if it exists
 * @param {string} filePath - Path to the file
 * @returns {Promise<void>}
 */
const safeDeleteFile = async (filePath) => {
    try {
        if (filePath && await fs.pathExists(filePath)) {
            await fs.unlink(filePath);
        }
    } catch (error) {
        logger.error('Error deleting file:', { 
            error: error.message, 
            filePath: filePath 
        });
    }
};

/**
 * Ensures a directory exists, creating it if necessary
 * @param {string} dirPath - Path to the directory
 * @returns {Promise<void>}
 */
const ensureDirectoryExists = async (dirPath) => {
    try {
        await fs.ensureDir(dirPath);
    } catch (error) {
        logger.error('Error creating directory:', { 
            error: error.message, 
            dirPath: dirPath 
        });
        throw error;
    }
};

/**
 * Gets file information (size, mtime, etc.)
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object>} - File stats
 */
const getFileInfo = async (filePath) => {
    try {
        const stats = await fs.stat(filePath);
        return {
            size: stats.size,
            mtime: stats.mtime,
            ctime: stats.ctime,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory()
        };
    } catch (error) {
        if (error.code === 'ENOENT') {
            return null;
        }
        throw error;
    }
};

/**
 * Generates a unique filename with a timestamp
 * @param {string} originalName - Original filename
 * @param {string} [prefix='file'] - Optional prefix
 * @returns {string} - Generated filename
 */
const generateUniqueFilename = (originalName, prefix = 'file') => {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    return `${prefix}_${baseName}_${timestamp}_${random}${ext}`.replace(/[^\w\d.-]/g, '_');
};

/**
 * Validates if a file path is within the allowed directory
 * @param {string} filePath - The file path to validate
 * @param {string} allowedDir - The allowed base directory
 * @returns {boolean} - Whether the path is safe
 */
const isPathSafe = (filePath, allowedDir) => {
    if (!filePath || !allowedDir) return false;
    
    const resolvedPath = path.resolve(filePath);
    const resolvedDir = path.resolve(allowedDir);
    
    return resolvedPath.startsWith(resolvedDir);
};

module.exports = {
    validateFileType,
    getFileChecksum,
    safeDeleteFile,
    ensureDirectoryExists,
    getFileInfo,
    generateUniqueFilename,
    isPathSafe
};
