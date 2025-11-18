const { check, validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Middleware to validate device information in request body
 */
const validateDeviceInfo = (req, res, next) => {
    // Log device info for debugging
    if (req.body.device_info) {
        logger.debug('Device info received', {
            device_id: req.body.device_id,
            device_model: req.body.device_model,
            android_version: req.body.android_version,
            sdk_int: req.body.sdk_int
        });
    }
    
    // If we already have validation errors from previous middleware, skip
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next();
    }
    
    next();
};

/**
 * Validation rules for device info
 */
const deviceInfoValidationRules = [
    check('device_id')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 8, max: 64 })
        .withMessage('Device ID must be between 8 and 64 characters'),
        
    check('device_model')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 128 })
        .withMessage('Device model must be less than 128 characters'),
        
    check('android_version')
        .optional()
        .isString()
        .trim()
        .matches(/^\d+(\.\d+)*$/, 'g')
        .withMessage('Invalid Android version format'),
        
    check('sdk_int')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('SDK version must be between 1 and 100')
        .toInt(),
        
    check('manufacturer')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 64 })
        .withMessage('Manufacturer must be less than 64 characters'),
        
    check('brand')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 64 })
        .withMessage('Brand must be less than 64 characters'),
        
    check('board')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 64 })
        .withMessage('Board must be less than 64 characters'),
        
    check('hardware')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 64 })
        .withMessage('Hardware must be less than 64 characters'),
        
    check('bootloader')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 64 })
        .withMessage('Bootloader must be less than 64 characters'),
        
    check('display')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 128 })
        .withMessage('Display must be less than 128 characters'),
        
    check('fingerprint')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 256 })
        .withMessage('Fingerprint must be less than 256 characters'),
        
    check('host')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 128 })
        .withMessage('Host must be less than 128 characters'),
        
    check('id')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 64 })
        .withMessage('ID must be less than 64 characters'),
        
    check('tags')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 256 })
        .withMessage('Tags must be less than 256 characters'),
        
    check('type')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 64 })
        .withMessage('Type must be less than 64 characters'),
        
    check('user')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 64 })
        .withMessage('User must be less than 64 characters'),
        
    check('time')
        .optional()
        .isISO8601()
        .withMessage('Time must be a valid ISO 8601 date'),
        
    check('battery_level')
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage('Battery level must be between 0 and 100')
        .toInt(),
        
    check('is_charging')
        .optional()
        .isBoolean()
        .withMessage('is_charging must be a boolean')
        .toBoolean(),
        
    check('network_type')
        .optional()
        .isIn(['wifi', 'mobile', 'ethernet', 'other', 'unknown', 'cellular'])
        .withMessage('Invalid network type'),
        
    check('is_roaming')
        .optional()
        .isBoolean()
        .withMessage('is_roaming must be a boolean')
        .toBoolean(),
        
    check('region')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 2, max: 10 })
        .withMessage('Region must be between 2 and 10 characters'),
        
    check('locale')
        .optional()
        .isString()
        .trim()
        .matches(/^[a-z]{2}_[A-Z]{2}$/)
        .withMessage('Locale must be in format en_US')
];

module.exports = {
    validateDeviceInfo,
    deviceInfoValidationRules
};
