const { Location, Device } = require('../../../models');
const { Op } = require('sequelize');
const logger = require('../../../utils/logger');
const { v4: uuidv4 } = require('uuid');
const geolib = require('geolib');
const { parse } = require('json2csv');
const { createObjectCsvWriter } = require('csv-writer');

/**
 * Sync location data from device to server
 */
exports.syncLocations = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { locations } = req.body;
        const requestId = req.requestId || 'unknown';

        // Validate input
        if (!Array.isArray(locations)) {
            return res.status(400).json({
                success: false,
                error: 'Locations must be an array'
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

        // Process locations in batches
        const BATCH_SIZE = 100;
        const results = {
            created: 0,
            updated: 0,
            failed: 0,
            errors: []
        };

        for (let i = 0; i < locations.length; i += BATCH_SIZE) {
            const batch = locations.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(location => 
                processLocation(deviceId, location).catch(error => {
                    logger.error(`[${requestId}] Error processing location:`, error);
                    return { error: error.message };
                })
            );

            const batchResults = await Promise.all(batchPromises);
            
            batchResults.forEach(result => {
                if (result && !result.error) {
                    if (result.wasNew) results.created++;
                    else results.updated++;
                } else {
                    results.failed++;
                    if (result?.error) {
                        results.errors.push(result.error);
                    }
                }
            });
        }

        logger.info(`[${requestId}] Synced ${locations.length} locations for device ${deviceId}: ${results.created} created, ${results.updated} updated, ${results.failed} failed`);

        return res.json({
            success: true,
            data: results
        });

    } catch (error) {
        logger.error('Error syncing locations:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to sync locations',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Process a single location (create or update)
 */
async function processLocation(deviceId, location) {
    // Validate required fields
    if (!location.timestamp || !location.latitude || !location.longitude) {
        throw new Error('Missing required location fields');
    }

    const [loc, created] = await Location.findOrCreate({
        where: {
            deviceId,
            timestamp: new Date(location.timestamp)
        },
        defaults: {
            ...location,
            deviceId,
            id: uuidv4(),
            point: {
                type: 'Point',
                coordinates: [parseFloat(location.longitude), parseFloat(latitude)],
                crs: { type: 'name', properties: { name: 'EPSG:4326'} }
            }
        }
    });

    if (!created) {
        await loc.update({
            ...location,
            point: {
                type: 'Point',
                coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)],
                crs: { type: 'name', properties: { name: 'EPSG:4326'} }
            }
        });
    }

    return { wasNew: created, location: loc };
}

/**
 * Get location history with filtering and pagination
 */
exports.getLocationHistory = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { 
            startDate, 
            endDate,
            minAccuracy,
            minSpeed,
            page = 1, 
            limit = 1000 
        } = req.query;

        // Build where clause
        const where = { deviceId };
        
        // Filter by date range
        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) where.timestamp[Op.gte] = new Date(startDate);
            if (endDate) where.timestamp[Op.lte] = new Date(endDate);
        }

        // Filter by accuracy
        if (minAccuracy) {
            where.accuracy = { [Op.lte]: parseFloat(minAccuracy) };
        }

        // Filter by speed
        if (minSpeed) {
            where.speed = { [Op.gte]: parseFloat(minSpeed) };
        }

        // Execute query with pagination
        const { count, rows } = await Location.findAndCountAll({
            where,
            order: [['timestamp', 'DESC']],
            limit: parseInt(limit),
            offset: (page - 1) * limit
        });

        return res.json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        logger.error('Error fetching location history:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch location history'
        });
    }
};

/**
 * Get current location
 */
exports.getCurrentLocation = async (req, res) => {
    try {
        const { deviceId } = req.params;

        // Get most recent location
        const location = await Location.findOne({
            where: { deviceId },
            order: [['timestamp', 'DESC']]
        });

        if (!location) {
            return res.status(404).json({
                success: false,
                error: 'No location data available'
            });
        }

        return res.json({
            success: true,
            data: location
        });

    } catch (error) {
        logger.error('Error fetching current location:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch current location'
        });
    }
};

/**
 * Get location statistics
 */
exports.getLocationStatistics = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { startDate, endDate } = req.query;

        // Build where clause
        const where = { deviceId };
        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) where.timestamp[Op.gte] = new Date(startDate);
            if (endDate) where.timestamp[Op.lte] = new Date(endDate);
        }

        // Get all locations for the device
        const locations = await Location.findAll({
            where,
            order: [['timestamp', 'ASC']],
            raw: true
        });

        if (locations.length === 0) {
            return res.json({
                success: true,
                data: {
                    totalLocations: 0,
                    firstSeen: null,
                    lastSeen: null,
                    distanceTraveled: 0,
                    averageSpeed: 0,
                    maxSpeed: 0,
                    locationsByHour: {},
                    locationsByDay: {}
                }
            });
        }

        // Calculate statistics
        let distanceTraveled = 0;
        let totalSpeed = 0;
        let maxSpeed = 0;
        const locationsByHour = {};
        const locationsByDay = {};

        // Process locations to calculate statistics
        for (let i = 1; i < locations.length; i++) {
            const prev = locations[i - 1];
            const curr = locations[i];

            // Calculate distance between points (in meters)
            const distance = geolib.getDistance(
                { latitude: prev.latitude, longitude: prev.longitude },
                { latitude: curr.latitude, longitude: curr.longitude }
            );
            
            // Calculate time difference (in hours)
            const timeDiff = (new Date(curr.timestamp) - new Date(prev.timestamp)) / (1000 * 60 * 60);
            
            // Calculate speed (km/h)
            const speed = timeDiff > 0 ? (distance / 1000) / timeDiff : 0;
            
            distanceTraveled += distance;
            totalSpeed += speed;
            maxSpeed = Math.max(maxSpeed, speed);

            // Group by hour
            const hour = new Date(curr.timestamp).getHours();
            locationsByHour[hour] = (locationsByHour[hour] || 0) + 1;

            // Group by day
            const day = new Date(curr.timestamp).toISOString().split('T')[0];
            locationsByDay[day] = (locationsByDay[day] || 0) + 1;
        }

        const averageSpeed = locations.length > 1 ? totalSpeed / (locations.length - 1) : 0;

        return res.json({
            success: true,
            data: {
                totalLocations: locations.length,
                firstSeen: locations[0].timestamp,
                lastSeen: locations[locations.length - 1].timestamp,
                distanceTraveled: distanceTraveled / 1000, // Convert to kilometers
                averageSpeed,
                maxSpeed,
                locationsByHour,
                locationsByDay
            }
        });

    } catch (error) {
        logger.error('Error fetching location statistics:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch location statistics'
        });
    }
};

/**
 * Get locations within a geographic boundary
 */
exports.getLocationsInArea = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { 
            north, 
            south, 
            east, 
            west,
            startDate,
            endDate
        } = req.query;

        // Validate coordinates
        if (!north || !south || !east || !west) {
            return res.status(400).json({
                success: false,
                error: 'North, south, east, and west coordinates are required'
            });
        }

        // Build where clause
        const where = {
            deviceId,
            latitude: { [Op.between]: [parseFloat(south), parseFloat(north)] },
            longitude: { [Op.between]: [parseFloat(west), parseFloat(east)] }
        };

        // Filter by date range if provided
        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) where.timestamp[Op.gte] = new Date(startDate);
            if (endDate) where.timestamp[Op.lte] = new Date(endDate);
        }

        // Execute query
        const locations = await Location.findAll({
            where,
            order: [['timestamp', 'ASC']]
        });

        return res.json({
            success: true,
            data: locations
        });

    } catch (error) {
        logger.error('Error fetching locations in area:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch locations in area'
        });
    }
};

/**
 * Export location data
 */
exports.exportLocations = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { format = 'json', startDate, endDate } = req.query;

        // Build where clause
        const where = { deviceId };
        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) where.timestamp[Op.gte] = new Date(startDate);
            if (endDate) where.timestamp[Op.lte] = new Date(endDate);
        }

        // Get locations
        const locations = await Location.findAll({
            where,
            order: [['timestamp', 'ASC']],
            raw: true
        });

        let data;
        let contentType;
        let fileName = `locations_${deviceId}_${new Date().toISOString().split('T')[0]}`;

        switch (format.toLowerCase()) {
            case 'csv':
                // Convert to CSV
                const csvFields = [
                    'timestamp', 'latitude', 'longitude', 'accuracy', 'altitude',
                    'speed', 'heading', 'batteryLevel', 'provider', 'isFromMockProvider'
                ];
                
                const csvWriter = createObjectCsvWriter({
                    path: 'temp.csv',
                    header: csvFields.map(field => ({ id: field, title: field }))
                });

                await csvWriter.writeRecords(locations);
                data = require('fs').readFileSync('temp.csv');
                require('fs').unlinkSync('temp.csv');
                
                contentType = 'text/csv';
                fileName += '.csv';
                break;

            case 'gpx':
                // Convert to GPX format
                let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="DK-Hawkshaw" 
    xmlns="http://www.topografix.com/GPX/1/1" 
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
    xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
    <trk>
        <name>Device ${deviceId} Track</name>
        <trkseg>
${locations.map(loc => `            <trkpt lat="${loc.latitude}" lon="${loc.longitude}">
                <ele>${loc.altitude || 0}</ele>
                <time>${new Date(loc.timestamp).toISOString()}</time>
                <speed>${loc.speed || 0}</speed>
                <hdop>${loc.accuracy || 0}</hdop>
            </trkpt>`).join('\n')}
        </trkseg>
    </trk>
</gpx>`;
                
                data = gpx;
                contentType = 'application/gpx+xml';
                fileName += '.gpx';
                break;

            case 'kml':
                // Convert to KML format
                let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
    <Document>
        <name>Device ${deviceId} Track</name>
        <Style id="track">
            <LineStyle>
                <color>7f00ffff</color>
                <width>4</width>
            </LineStyle>
            <IconStyle>
                <Icon>
                    <href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href>
                </Icon>
            </IconStyle>
        </Style>
        <Placemark>
            <name>Device Track</name>
            <styleUrl>#track</styleUrl>
            <LineString>
                <extrude>1</extrude>
                <tessellate>1</tessellate>
                <altitudeMode>absolute</altitudeMode>
                <coordinates>
${locations.map(loc => `                    ${loc.longitude},${loc.latitude},${loc.altitude || 0}`).join('\n')}
                </coordinates>
            </LineString>
        </Placemark>
    </Document>
</kml>`;
                
                data = kml;
                contentType = 'application/vnd.google-earth.kml+xml';
                fileName += '.kml';
                break;

            case 'geojson':
            case 'json':
            default:
                // Convert to GeoJSON
                const geoJson = {
                    type: 'FeatureCollection',
                    features: locations.map(loc => ({
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [loc.longitude, loc.latitude, loc.altitude || 0]
                        },
                        properties: {
                            timestamp: loc.timestamp,
                            accuracy: loc.accuracy,
                            speed: loc.speed,
                            heading: loc.heading,
                            batteryLevel: loc.batteryLevel,
                            provider: loc.provider,
                            isFromMockProvider: loc.isFromMockProvider
                        }
                    }))
                };
                
                data = JSON.stringify(geoJson, null, 2);
                contentType = format.toLowerCase() === 'geojson' 
                    ? 'application/geo+json' 
                    : 'application/json';
                fileName += format.toLowerCase() === 'geojson' ? '.geojson' : '.json';
        }

        // Set headers and send file
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        return res.send(data);

    } catch (error) {
        logger.error('Error exporting locations:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to export locations'
        });
    }
};

/**
 * Get location heatmap data
 */
exports.getLocationHeatmap = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { startDate, endDate, zoom = 12 } = req.query;

        // Build where clause
        const where = { deviceId };
        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) where.timestamp[Op.gte] = new Date(startDate);
            if (endDate) where.timestamp[Op.lte] = new Date(endDate);
        }

        // Get all locations for the device
        const locations = await Location.findAll({
            where,
            attributes: ['latitude', 'longitude', 'timestamp'],
            order: [['timestamp', 'ASC']],
            raw: true
        });

        // Group locations by grid cell
        const grid = {};
        const cellSize = 0.01; // Adjust based on zoom level

        locations.forEach(loc => {
            const lat = Math.floor(loc.latitude / cellSize) * cellSize;
            const lng = Math.floor(loc.longitude / cellSize) * cellSize;
            const key = `${lat},${lng}`;
            
            if (!grid[key]) {
                grid[key] = {
                    latitude: lat + cellSize / 2,
                    longitude: lng + cellSize / 2,
                    count: 0,
                    timestamps: []
                };
            }
            
            grid[key].count++;
            grid[key].timestamps.push(loc.timestamp);
        });

        // Convert grid to array and calculate intensity
        const heatmapData = Object.values(grid).map(cell => ({
            ...cell,
            intensity: Math.min(1, cell.count / 100), // Normalize to 0-1 range
            firstSeen: Math.min(...cell.timestamps),
            lastSeen: Math.max(...cell.timestamps)
        }));

        return res.json({
            success: true,
            data: heatmapData
        });

    } catch (error) {
        logger.error('Error generating heatmap data:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to generate heatmap data'
        });
    }
};