const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { validateRequest } = require('../../../middleware/validation');
const smsController = require('../../../controllers/api/v1/smsController');
const { authorize } = require('../../../middleware/auth');

// Sync SMS messages from device
router.post(
    '/:deviceId/sync',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        body('messages').isArray().withMessage('Messages must be an array'),
        body('messages.*.messageId').isString().notEmpty(),
        body('messages.*.address').isString().notEmpty(),
        body('messages.*.body').isString().notEmpty(),
        body('messages.*.type').isIn(['inbox', 'sent', 'draft', 'outbox', 'failed', 'queued']),
        body('messages.*.date').isISO8601(),
        body('messages.*.threadId').optional().isString(),
        body('messages.*.status').optional().isString(),
        body('messages.*.isRead').optional().isBoolean()
    ],
    validateRequest,
    authorize('device'),
    smsController.syncSms
);

// Get SMS messages with filters
router.get(
    '/:deviceId/messages',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        query('type').optional().isIn(['inbox', 'sent', 'draft', 'outbox', 'failed', 'queued']),
        query('threadId').optional().isString(),
        query('address').optional().isString(),
        query('search').optional().isString(),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('read').optional().isBoolean(),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 1000 })
    ],
    validateRequest,
    authorize('admin', 'device'),
    smsController.getSmsMessages
);

// Get SMS conversations/threads
router.get(
    '/:deviceId/threads',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        query('search').optional().isString(),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 1000 })
    ],
    validateRequest,
    authorize('admin', 'device'),
    smsController.getSmsThreads
);

// Get messages in a specific thread
router.get(
    '/:deviceId/threads/:threadId',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        param('threadId').isString().notEmpty(),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 1000 })
    ],
    validateRequest,
    authorize('admin', 'device'),
    smsController.getThreadMessages
);

// Send a new SMS message
router.post(
    '/:deviceId/send',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        body('address').isString().notEmpty(),
        body('body').isString().notEmpty(),
        body('threadId').optional().isString()
    ],
    validateRequest,
    authorize('admin', 'device'),
    smsController.sendSms
);

// Delete SMS messages
router.delete(
    '/:deviceId',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        body('messageIds').optional().isArray(),
        body('threadId').optional().isString(),
        body('all').optional().isBoolean()
    ],
    validateRequest,
    authorize('admin', 'device'),
    smsController.deleteSms
);

// Get SMS statistics
router.get(
    '/:deviceId/statistics',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601()
    ],
    validateRequest,
    authorize('admin', 'device'),
    smsController.getSmsStatistics
);

module.exports = router;