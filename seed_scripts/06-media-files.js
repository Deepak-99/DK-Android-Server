'use strict';

const { sequelize, MediaFile, Device } = require('../config/database');
const { 
  safeModelOperation, 
  randomString,
  randomElement,
  randomBool,
  randomDate,
  nowMinus,
  sampleData,
  logger,
  randInt
} = require('./_config');
const path = require('path');
const fs = require('fs');

// Media types and extensions
const MEDIA_TYPES = ['image', 'video', 'audio', 'document'];
const MEDIA_EXTENSIONS = {
  'image': ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
  'video': ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  'audio': ['mp3', 'wav', 'ogg', 'm4a', 'flac'],
  'document': ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt']
};

// Sample media metadata
const CAMERA_MAKERS = ['Samsung', 'Google', 'Apple', 'Huawei', 'Xiaomi', 'OnePlus', 'Sony', 'LG'];
const CAMERA_MODELS = [
  'Back Camera', 'Front Camera', 'Wide Angle', 'Telephoto', 'Macro', 'Ultra Wide'
];

/**
 * Generate a random media file
 * @param {string} deviceId - Device ID
 * @returns {Object} - Media file object
 */
function generateMediaFile(deviceId) {
  const mediaType = randomElement(MEDIA_TYPES);
  const extension = randomElement(MEDIA_EXTENSIONS[mediaType]);
  const fileName = `${randomString(8)}.${extension}`;
  const fileSize = mediaType === 'image' ? randInt(50000, 5000000) : 
                  mediaType === 'video' ? randInt(5000000, 500000000) :
                  mediaType === 'audio' ? randInt(1000000, 20000000) :
                  randInt(10000, 10000000);
  
  const now = new Date();
  const captureDate = randomDate(nowMinus(90), now);
  
  // Generate metadata based on media type
  let metadata = {};
  
  if (mediaType === 'image' || mediaType === 'video') {
    metadata = {
      width: mediaType === 'image' ? randInt(800, 4000) : randInt(1280, 3840),
      height: mediaType === 'image' ? randInt(600, 3000) : randInt(720, 2160),
      duration: mediaType === 'video' ? randInt(1, 600) : null, // in seconds
      camera: {
        make: randomElement(CAMERA_MAKERS),
        model: randomElement(CAMERA_MODELS),
        iso: randInt(50, 6400),
        aperture: `f/${[1.8, 2.0, 2.2, 2.4, 2.8, 3.5, 4.0, 5.6][randInt(0, 7)]}`,
        exposure: `${1/randInt(30, 2000)}s`
      },
      location: randomBool(0.7) ? {
        latitude: (Math.random() * 180 - 90).toFixed(6),
        longitude: (Math.random() * 360 - 180).toFixed(6),
        altitude: randInt(0, 3000),
        accuracy: randInt(1, 100)
      } : null
    };
  }
  
  // Generate a realistic file path based on media type
  const folders = {
    'image': 'DCIM/Camera',
    'video': 'Movies',
    'audio': 'Music',
    'document': 'Documents'
  };
  
  const folder = folders[mediaType];
  const filePath = path.join('storage', 'emulated', '0', folder, fileName);
  
  return {
    device_id: deviceId,
    filename: fileName,
    original_name: fileName,
    file_path: filePath,
    file_size: fileSize,
    mime_type: `${mediaType}/${extension === 'jpg' ? 'jpeg' : extension}`,
    media_type: mediaType,
    duration: metadata.duration || null,
    width: metadata.width || null,
    height: metadata.height || null,
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
    is_favorite: randomBool(0.1), // 10% chance of being favorited
    is_hidden: randomBool(0.05), // 5% chance of being hidden
    date_taken: captureDate,
    created_at: new Date(),
    updated_at: new Date()
  };
}

/**
 * Seed media files for devices
 * @param {Array} devices - Array of device objects
 * @param {Object} [options={}] - Options for seeding
 * @param {number} [options.filesPerDevice=50] - Number of media files per device
 * @param {Object} [transaction=null] - Sequelize transaction
 * @returns {Promise<Array>} - Array of created media files
 */
async function seedMediaFiles(devices, options = {}, transaction = null) {
  const { filesPerDevice = 50 } = options;
  const createdFiles = [];
  
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
    
    for (let i = 0; i < filesPerDevice; i++) {
      const mediaFile = generateMediaFile(deviceId);
      
      const result = await safeModelOperation(
        async () => {
          const file = await MediaFile.create(mediaFile, {
            ...(transaction ? { transaction } : {})
          });
          
          logger.debug(`[seed] Created ${file.mediaType}: ${file.fileName} on device ${deviceId}`);
          return file;
        },
        'MediaFile',
        `Error creating media file ${i + 1} for device ${deviceId}`
      );
      
      if (result.success) {
        createdFiles.push(result.result);
      }
    }
    
    logger.info(`[seed] Created ${filesPerDevice} media files for device ${deviceId}`);
  }
  
  return createdFiles;
}

/**
 * Main seed function for media files
 * @param {Object} [options={}] - Options for seeding
 * @param {number} [options.filesPerDevice=50] - Number of media files per device
 * @param {Array} [devices=[]] - Array of device objects
 * @param {Object} [transaction=null] - Sequelize transaction
 * @returns {Promise<Object>} - Result of the operation
 */
async function seed(options = {}, devices = [], transaction = null) {
  const { filesPerDevice = 50 } = options;
  
  try {
    logger.info('[seed] Starting media files seeding...');
    
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
    
    const mediaFiles = await seedMediaFiles(deviceList, { filesPerDevice }, transaction);
    
    // Count files by type
    const countByType = mediaFiles.reduce((acc, file) => {
      acc[file.mediaType] = (acc[file.mediaType] || 0) + 1;
      return acc;
    }, {});
    
    logger.info('[seed] Media files by type:', countByType);
    logger.info(`[seed] Successfully seeded ${mediaFiles.length} media files across ${deviceList.length} devices`);
    
    return {
      success: true,
      mediaFiles,
      totalFiles: mediaFiles.length,
      countByType,
      devicesSeeded: deviceList.length
    };
  } catch (error) {
    logger.error('[seed] Error in media files seeding:', error);
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
      
      // Then seed media files
      const result = await seed({ filesPerDevice: 20 }, devicesResult.devices);
      
      if (result.success) {
        logger.info('Media files seeding completed successfully');
        process.exit(0);
      } else {
        logger.error('Media files seeding failed');
        process.exit(1);
      }
    } catch (error) {
      logger.error('Error in media files seeding:', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  seedMediaFiles,
  seed
};
