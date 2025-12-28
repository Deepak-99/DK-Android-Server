const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { validateRequest } = require('../../../middleware/validation');
const callLogController = require('../../../controllers/api/v1/callLogController');
const { authorize } = require('../../../middleware/auth');

// Sync call logs from device
router.post(
    '/:deviceId/sync',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        body('callLogs').isArray().withMessage('Call logs must be an array'),
        body('callLogs.*.phoneNumber').isString().notEmpty(),
        body('callLogs.*.type').isIn(['incoming', 'outgoing', 'missed', 'rejected', 'blocked', 'answered_externally']),
        body('callLogs.*.date').isISO8601(),
        body('callLogs.*.duration').isInt({ min: 0 }),
        body('callLogs.*.contactName').optional().isString(),
        body('callLogs.*.isRead').optional().isBoolean(),
        body('callLogs.*.simSlot').optional().isInt({ min: 0, max: 1 }),
        body('callLogs.*.phoneAccountId').optional().isString(),
        body('callLogs.*.features').optional().isInt(),
        body('callLogs.*.transcription').optional().isString(),
        body('callLogs.*.cachedNumberType').optional().isInt(),
        body('callLogs.*.cachedNumberLabel').optional().isString(),
        body('callLogs.*.cachedName').optional().isString(),
        body('callLogs.*.cachedMatchedNumber').optional().isString(),
        body('callLogs.*.normalizedNumber').optional().isString(),
        body('callLogs.*.normalizedNumberE164').optional().isString(),
        body('callLogs.*.viaNumber').optional().isString(),
        body('callLogs.*.presentation').optional().isInt({ min: 1, max: 3 }),
        body('callLogs.*.postDialDigits').optional().isString(),
        body('callLogs.*.subscriptionId').optional().isInt(),
        body('callLogs.*.isNew').optional().isBoolean(),
        body('callLogs.*.cachedPhotoId').optional().isInt(),
        body('callLogs.*.cachedPhotoUri').optional().isString(),
        body('callLogs.*.cachedLookupUri').optional().isString(),
        body('callLogs.*.cachedFormattedNumber').optional().isString(),
        body('callLogs.*.lastModified').optional().isISO8601(),
        body('callLogs.*.countryIso').optional().isString().isLength(2),
        body('callLogs.*.geocodedLocation').optional().isString(),
        body('callLogs.*.isVoicemail').optional().isBoolean(),
        body('callLogs.*.voicemailUri').optional().isString(),
        body('callLogs.*.voicemailFileUri').optional().isString(),
        body('callLogs.*.voicemailMimeType').optional().isString(),
        body('callLogs.*.voicemailDuration').optional().isInt({ min: 0 }),
        body('callLogs.*.voicemailTranscription').optional().isString(),
        body('callLogs.*.voicemailTranscriptionState').optional().isInt(),
        body('callLogs.*.voicemailResult').optional().isString(),
        body('callLogs.*.voicemailActionUri').optional().isString(),
        body('callLogs.*.phoneAccountComponentName').optional().isString(),
        body('callLogs.*.phoneAccountAddress').optional().isString(),
        body('callLogs.*.phoneAccountLabel').optional().isString(),
        body('callLogs.*.phoneAccountColor').optional().isInt(),
        body('callLogs.*.phoneAccountHighlightColor').optional().isInt(),
        body('callLogs.*.phoneAccountIcon').optional().isString(),
        body('callLogs.*.phoneAccountIconPackageName').optional().isString(),
        body('callLogs.*.phoneAccountIconResId').optional().isInt(),
        body('callLogs.*.phoneAccountIconTint').optional().isInt(),
        body('callLogs.*.phoneAccountIconBackgroundColor').optional().isInt(),
        body('callLogs.*.phoneAccountCallCapabilities').optional().isInt(),
        body('callLogs.*.phoneAccountSubscriptionAddress').optional().isString(),
        body('callLogs.*.phoneAccountSupportedUriSchemes').optional().isArray()
    ],
    validateRequest,
    authorize('device'),
    callLogController.syncCallLogs
);

// Get call logs with filters
router.get(
    '/:deviceId/logs',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        query('phoneNumber').optional().isString(),
        query('type').optional().isIn(['incoming', 'outgoing', 'missed', 'rejected', 'blocked', 'answered_externally']),
        query('minDuration').optional().isInt({ min: 0 }),
        query('maxDuration').optional().isInt({ min: 0 }),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('isRead').optional().isBoolean(),
        query('search').optional().isString(),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 1000 }),
        query('sortBy').optional().isIn(['date', 'duration', 'type', 'phoneNumber']),
        query('sortOrder').optional().isIn(['ASC', 'DESC'])
    ],
    validateRequest,
    authorize('admin', 'device'),
    callLogController.getCallLogs
);

// Get call log by ID
router.get(
    '/:deviceId/logs/:logId',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        param('logId').isString().notEmpty()
    ],
    validateRequest,
    authorize('admin', 'device'),
    callLogController.getCallLog
);

// Update call log
router.patch(
    '/:deviceId/logs/:logId',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        param('logId').isString().notEmpty(),
        body('contactName').optional().isString(),
        body('isRead').optional().isBoolean(),
        body('notes').optional().isString(),
        body('tags').optional().isArray(),
        body('isImportant').optional().isBoolean(),
        body('isSpam').optional().isBoolean()
    ],
    validateRequest,
    authorize('admin', 'device'),
    callLogController.updateCallLog
);

// Delete call logs
router.delete(
    '/:deviceId/logs',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        body('logIds').optional().isArray(),
        body('all').optional().isBoolean()
    ],
    validateRequest,
    authorize('admin', 'device'),
    callLogController.deleteCallLogs
);

// Get call statistics
router.get(
    '/:deviceId/statistics',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601()
    ],
    validateRequest,
    authorize('admin', 'device'),
    callLogController.getCallStatistics
);

// Export call logs
router.get(
    '/:deviceId/export',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        query('format').optional().isIn(['json', 'csv', 'xlsx']),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601()
    ],
    validateRequest,
    authorize('admin', 'device'),
    callLogController.exportCallLogs
);

// Get call summary
router.get(
    '/:deviceId/summary',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601()
    ],
    validateRequest,
    authorize('admin', 'device'),
    callLogController.getCallSummary
);

module.exports = router;