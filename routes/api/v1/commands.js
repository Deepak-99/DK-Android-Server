// routes/api/v1/commandRoutes.js
const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { validateRequest } = require('../../../middleware/validation');
const commandController = require('../../../controllers/api/v1/commandController');
const { authorize } = require('../../../middleware/auth');
const { COMMAND_PRIORITIES } = require('../../../constants/commands');

// Queue a new command
router.post(
    '/devices/:deviceId/commands',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        body('command').isString().notEmpty(),
        body('params').optional().isObject(),
        body('priority').optional().isIn(Object.values(COMMAND_PRIORITIES)),
        body('executeAt').optional().isISO8601(),
        body('ttl').optional().isInt({ min: 1 }),
        body('requiresAck').optional().isBoolean(),
        body('metadata').optional().isObject()
    ],
    validateRequest,
    authorize('admin', 'device:write'),
    commandController.queueCommand
);

// Get command status
router.get(
    '/commands/:commandId',
    [
        param('commandId').isUUID().withMessage('Invalid command ID')
    ],
    validateRequest,
    authorize('admin', 'device:read'),
    commandController.getCommandStatus
);

// List commands with filters
router.get(
    '/commands',
    [
        query('deviceId').optional().isUUID(),
        query('status').optional().isString(),
        query('command').optional().isString(),
        query('priority').optional().isIn(Object.values(COMMAND_PRIORITIES)),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 1000 }),
        query('sortBy').optional().isIn(['createdAt', 'priority', 'status', 'command']),
        query('sortOrder').optional().isIn(['ASC', 'DESC'])
    ],
    validateRequest,
    authorize('admin', 'device:read'),
    commandController.listCommands
);

// Cancel a command
router.post(
    '/commands/:commandId/cancel',
    [
        param('commandId').isUUID().withMessage('Invalid command ID')
    ],
    validateRequest,
    authorize('admin', 'device:write'),
    commandController.cancelCommand
);

// Retry a failed command
router.post(
    '/commands/:commandId/retry',
    [
        param('commandId').isUUID().withMessage('Invalid command ID')
    ],
    validateRequest,
    authorize('admin', 'device:write'),
    commandController.retryCommand
);

// Get command statistics
router.get(
    '/commands/statistics',
    [
        query('deviceId').optional().isUUID(),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601()
    ],
    validateRequest,
    authorize('admin', 'device:read'),
    commandController.getCommandStatistics
);

// Acknowledge command execution (called by device)
router.post(
    '/commands/:commandId/acknowledge',
    [
        param('commandId').isUUID().withMessage('Invalid command ID'),
        body('success').isBoolean(),
        body('result').optional().isObject(),
        body('error').optional().isString()
    ],
    validateRequest,
    authorize('device'),
    commandController.acknowledgeCommand
);

// Get pending commands for a device (called by device)
router.get(
    '/devices/:deviceId/commands/pending',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        query('limit').optional().isInt({ min: 1, max: 50 })
    ],
    validateRequest,
    authorize('device'),
    commandController.getPendingCommands
);

module.exports = router;