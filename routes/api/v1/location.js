const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { validateRequest } = require('../../../middleware/validation');
const locationController = require('../../../controllers/api/v1/locationController');
const { authorize } = require('../../../middleware/auth');

// Sync location data from device
router.post(
    '/:deviceId/sync',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        body('locations').isArray().withMessage('Locations must be an array'),
        body('locations.*.timestamp').isISO8601(),
        body('locations.*.latitude').isFloat({ min: -90, max: 90 }),
        body('locations.*.longitude').isFloat({ min: -180, max: 180 }),
        body('locations.*.accuracy').optional().isFloat({ min: 0 }),
        body('locations.*.altitude').optional().isFloat(),
        body('locations.*.speed').optional().isFloat({ min: 0 }),
        body('locations.*.heading').optional().isFloat({ min: 0, max: 360 }),
        body('locations.*.batteryLevel').optional().isFloat({ min: 0, max: 100 }),
        body('locations.*.provider').optional().isString(),
        body('locations.*.isFromMockProvider').optional().isBoolean()
    ],
    validateRequest,
    authorize('device'),
    locationController.syncLocations
);

// Get location history
router.get(
    '/:deviceId/history',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('minAccuracy').optional().isFloat({ min: 0 }),
        query('minSpeed').optional().isFloat({ min: 0 }),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 5000 })
    ],
    validateRequest,
    authorize('admin', 'device'),
    locationController.getLocationHistory
);

// Get current location
router.get(
    '/:deviceId/current',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID')
    ],
    validateRequest,
    authorize('admin', 'device'),
    locationController.getCurrentLocation
);

// Get location statistics
router.get(
    '/:deviceId/statistics',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601()
    ],
    validateRequest,
    authorize('admin', 'device'),
    locationController.getLocationStatistics
);

// Get locations within a geographic boundary
router.get(
    '/:deviceId/area',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        query('north').isFloat({ min: -90, max: 90 }),
        query('south').isFloat({ min: -90, max: 90 }),
        query('east').isFloat({ min: -180, max: 180 }),
        query('west').isFloat({ min: -180, max: 180 }),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601()
    ],
    validateRequest,
    authorize('admin', 'device'),
    locationController.getLocationsInArea
);

// Export location data
router.get(
    '/:deviceId/export',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        query('format').optional().isIn(['json', 'geojson', 'csv', 'gpx', 'kml']),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601()
    ],
    validateRequest,
    authorize('admin', 'device'),
    locationController.exportLocations
);

// Get location heatmap data
router.get(
    '/:deviceId/heatmap',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('zoom').optional().isInt({ min: 1, max: 20 })
    ],
    validateRequest,
    authorize('admin', 'device'),
    locationController.getLocationHeatmap
);

module.exports = router;