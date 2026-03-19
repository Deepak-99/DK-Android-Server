'use strict';

const { sequelize, DeviceLocation, Device } = require('../config/database');
const { 
  safeModelOperation, 
  randomElement,
  randomBool,
  randomDate,
  nowMinus,
  sampleData,
  logger,
  randInt
} = require('./_config');

// Sample locations (major cities with coordinates)
const SAMPLE_LOCATIONS = [
  { name: 'New York', lat: 40.7128, lng: -74.0060 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Cape Town', lat: -33.9249, lng: 18.4241 },
  { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 }
];

/**
 * Generate a random location near a given point
 * @param {Object} center - Center point with lat and lng
 * @param {number} radius - Radius in kilometers
 * @returns {Object} - New location with lat and lng
 */
function generateNearbyLocation(center, radius = 1) {
  // Convert kilometers to degrees (approximate)
  const radiusInDegrees = radius / 111.32;
  
  // Generate random angle and distance
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusInDegrees;
  
  // Calculate new coordinates
  const lat = center.lat + (distance * Math.cos(angle));
  const lng = center.lng + (distance * Math.sin(angle));
  
  return { lat, lng };
}

/**
 * Generate location history for a device
 * @param {string} deviceId - Device ID
 * @param {number} count - Number of location points to generate
 * @returns {Array} - Array of location objects
 */
function generateLocationHistory(deviceId, count = 10) {
  const locations = [];
  const baseLocation = randomElement(SAMPLE_LOCATIONS);
  const now = new Date();
  
  // Generate a route with some randomness
  for (let i = 0; i < count; i++) {
    // Move slightly from the previous location or base location
    const prevLocation = i > 0 ? locations[i - 1] : baseLocation;
    const newLocation = generateNearbyLocation(prevLocation, 0.1); // Within 100m
    
    // Timestamp - more recent locations are more frequent
    const timeOffset = (count - i) * randInt(5, 60) * 60 * 1000; // 5-60 minutes between points
    const timestamp = new Date(now.getTime() - timeOffset);
    
    locations.push({
      deviceId,
      latitude: newLocation.lat,
      longitude: newLocation.lng,
      accuracy: randInt(5, 100), // 5-100 meters accuracy
      altitude: randInt(0, 1000), // 0-1000 meters
      speed: randInt(0, 120) / 3.6, // 0-120 km/h in m/s
      heading: randInt(0, 360), // 0-359 degrees
      timestamp,
      provider: randomElement(['gps', 'network', 'fused', 'passive']),
      isFromMockProvider: randomBool(0.1), // 10% chance of being a mock location
      batteryLevel: randInt(10, 100), // 10-100%
      isCharging: randomBool(0.3), // 30% chance of charging
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }
  
  return locations;
}

/**
 * Seed device locations
 * @param {Array} devices - Array of device objects
 * @param {Object} [options={}] - Options for seeding
 * @param {number} [options.locationsPerDevice=20] - Number of location points per device
 * @param {Object} [transaction=null] - Sequelize transaction
 * @returns {Promise<Array>} - Array of created location records
 */
async function seedDeviceLocations(devices, options = {}, transaction = null) {
  const { locationsPerDevice = 20 } = options;
  const createdLocations = [];
  
  if (!devices || devices.length === 0) {
    logger.warn('[seed] No devices provided. Fetching all devices...');
    devices = await Device.findAll({
      attributes: ['id', 'deviceId'],
      ...(transaction ? { transaction } : {})
    });
    
    if (devices.length === 0) {
      logger.warn('[seed] No devices found. Please seed devices first.');
      return [];
    }
  }
  
  for (const device of devices) {
    const deviceId = device.deviceId || device.id;
    
    // Generate location history for this device
    const locations = generateLocationHistory(deviceId, locationsPerDevice);
    
    // Save locations to database
    for (const location of locations) {
      const result = await safeModelOperation(
        async () => {
          const loc = await DeviceLocation.create(location, {
            ...(transaction ? { transaction } : {})
          });
          return loc;
        },
        'DeviceLocation',
        `Error creating location for device ${deviceId}`
      );
      
      if (result.success) {
        createdLocations.push(result.result);
      }
    }
    
    logger.info(`[seed] Created ${locations.length} location points for device ${deviceId}`);
  }
  
  return createdLocations;
}

/**
 * Get the most recent location for each device
 * @param {Array} deviceIds - Array of device IDs
 * @param {Object} [transaction=null] - Sequelize transaction
 * @returns {Promise<Object>} - Object mapping device IDs to their latest location
 */
async function getLatestLocations(deviceIds, transaction = null) {
  const latestLocations = {};
  
  for (const deviceId of deviceIds) {
    const location = await DeviceLocation.findOne({
      where: { device_id: deviceId },
      order: [['timestamp', 'DESC']],
      ...(transaction ? { transaction } : {})
    });
    
    if (location) {
      latestLocations[deviceId] = location;
    }
  }
  
  return latestLocations;
}

/**
 * Main seed function for device locations
 * @param {Object} [options={}] - Options for seeding
 * @param {number} [options.locationsPerDevice=20] - Number of location points per device
 * @param {Array} [devices=[]] - Array of device objects
 * @param {boolean} [updateDevices=true] - Whether to update device's last known location
 * @param {Object} [transaction=null] - Sequelize transaction
 * @returns {Promise<Object>} - Result of the operation
 */
async function seed(options = {}, devices = [], updateDevices = true, transaction = null) {
  const { locationsPerDevice = 20 } = options;
  
  try {
    logger.info('[seed] Starting device locations seeding...');
    
    // If no devices provided, get all devices
    let deviceList = devices;
    if (!deviceList || deviceList.length === 0) {
      deviceList = await Device.findAll({
        attributes: ['id', 'deviceId'],
        ...(transaction ? { transaction } : {})
      });
    }
    
    if (deviceList.length === 0) {
      throw new Error('No devices found. Please seed devices first.');
    }
    
    const deviceIds = deviceList.map(d => d.deviceId || d.id);
    const locations = await seedDeviceLocations(deviceList, { locationsPerDevice }, transaction);
    
    // Update device's last known location
    if (updateDevices) {
      const latestLocations = await getLatestLocations(deviceIds, transaction);
      
      for (const device of deviceList) {
        const deviceId = device.deviceId || device.id;
        const location = latestLocations[deviceId];
        
        if (location) {
          await device.update({
            lastKnownLocation: {
              type: 'Point',
              coordinates: [location.longitude, location.latitude],
              crs: { type: 'name', properties: { name: 'EPSG:4326' }}
            },
            lastLocationUpdate: location.timestamp,
            locationAccuracy: location.accuracy
          }, {
            ...(transaction ? { transaction } : {})
          });
          
          logger.debug(`[seed] Updated device ${deviceId} with latest location`);
        }
      }
    }
    
    logger.info(`[seed] Successfully seeded ${locations.length} location points across ${deviceList.length} devices`);
    
    return {
      success: true,
      locations,
      totalLocations: locations.length,
      devicesSeeded: deviceList.length
    };
  } catch (error) {
    logger.error('[seed] Error in device locations seeding:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// If this file is run directly, execute the seed
if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      logger.info('Connected to the database');
      
      // First, seed users and devices if not already done
      const { seedUsers } = require('./01-users');
      const { seedDevices } = require('./02-devices');
      
      const usersResult = await seedUsers({ testUsersCount: 1 });
      if (!usersResult.success) {
        throw new Error('Failed to seed users');
      }
      
      const devicesResult = await seedDevices({ devicesCount: 1, users: [usersResult.admin] });
      if (!devicesResult.success) {
        throw new Error('Failed to seed devices');
      }
      
      // Then seed device locations
      const result = await seed({ locationsPerDevice: 24 }, devicesResult.devices); // 24 hours of data
      
      if (result.success) {
        logger.info('Device locations seeding completed successfully');
        process.exit(0);
      } else {
        logger.error('Device locations seeding failed');
        process.exit(1);
      }
    } catch (error) {
      logger.error('Error in device locations seeding:', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  seedDeviceLocations,
  getLatestLocations,
  seed
};
