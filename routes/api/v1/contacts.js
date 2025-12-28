const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { validateRequest } = require('../../../middleware/validation');
const contactController = require('../../../controllers/api/v1/contactController');
const { authorize } = require('../../../middleware/auth');

// Sync contacts from device
router.post(
    '/:deviceId/sync',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        body('contacts').isArray().withMessage('Contacts must be an array'),
        body('contacts.*.contactId').isString().notEmpty(),
        body('contacts.*.displayName').isString().notEmpty(),
        body('contacts.*.name').optional().isObject(),
        body('contacts.*.phoneNumbers').optional().isArray(),
        body('contacts.*.emails').optional().isArray(),
        body('contacts.*.addresses').optional().isArray(),
        body('contacts.*.organization').optional().isString(),
        body('contacts.*.jobTitle').optional().isString(),
        body('contacts.*.note').optional().isString(),
        body('contacts.*.groups').optional().isArray()
    ],
    validateRequest,
    authorize('device'),
    contactController.syncContacts
);

// Get contacts with filters
router.get(
    '/:deviceId',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        query('search').optional().isString(),
        query('group').optional().isString(),
        query('hasPhone').optional().isBoolean(),
        query('hasEmail').optional().isBoolean(),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 1000 })
    ],
    validateRequest,
    authorize('admin', 'device'),
    contactController.getContacts
);

// Get contact statistics
router.get(
    '/:deviceId/statistics',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID')
    ],
    validateRequest,
    authorize('admin', 'device'),
    contactController.getContactStatistics
);

// Delete contacts
router.delete(
    '/:deviceId',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        body('contactIds').optional().isArray(),
        body('all').optional().isBoolean()
    ],
    validateRequest,
    authorize('admin', 'device'),
    contactController.deleteContacts
);

// Export contacts
router.get(
    '/:deviceId/export',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        query('format').optional().isIn(['json', 'csv', 'vcard'])
    ],
    validateRequest,
    authorize('admin', 'device'),
    contactController.exportContacts
);

module.exports = router;