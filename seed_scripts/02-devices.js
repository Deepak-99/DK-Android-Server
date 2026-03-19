'use strict';

const { sequelize, Device, User } = require('../config/database');
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

// Device manufacturers and models for sample data
const DEVICE_MANUFACTURERS = ['Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Apple', 'Huawei', 'Oppo', 'Vivo', 'Realme', 'Motorola'];
const DEVICE_MODELS = {
  'Samsung': ['Galaxy S21', 'Galaxy S22', 'Galaxy Note 20', 'Galaxy A52', 'Galaxy Z Fold 3'],
  'Google': ['Pixel 6', 'Pixel 6 Pro', 'Pixel 5a', 'Pixel 4a', 'Pixel 4 XL'],
  'OnePlus': ['10 Pro', '9 Pro', 'Nord 2', '8T', 'Nord CE'],
  'Xiaomi': ['Mi 11', 'Redmi Note 11', 'Poco X4', 'Mi 11T Pro', 'Redmi 10'],
  'Apple': ['iPhone 13', 'iPhone 13 Pro', 'iPhone 12', 'iPhone SE', 'iPhone 11'],
  'Huawei': ['P50 Pro', 'Mate 40 Pro', 'P40 Pro', 'Nova 9', 'P30 Pro'],
  'Oppo': ['Find X5 Pro', 'Reno 7', 'Find X3 Pro', 'A96', 'A55'],
  'Vivo': ['X70 Pro+', 'V23 5G', 'X60 Pro', 'Y33s', 'Y21s'],
  'Realme': ['GT 2 Pro', '9 Pro+', '8 Pro', 'Narzo 50', '8 5G'],
  'Motorola': ['Edge 30 Pro', 'Moto G100', 'Moto G60', 'Moto G50', 'Moto G30']
};

// OS versions
const ANDROID_VERSIONS = [
  '12', '11', '10', '9.0', '8.1', '8.0', '7.1', '7.0', '6.0', '5.1', '5.0'
];

/**
 * Generate a random device ID (IMEI-like format)
 * @returns {string} - Random device ID
 */
function generateDeviceId() {
  // Generate a random 15-digit number (IMEI is typically 15 digits)
  return Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join('');
}

/**
 * Generate a random device name
 * @param {string} manufacturer - Device manufacturer
 * @param {string} model - Device model
 * @returns {string} - Formatted device name
 */
function generateDeviceName(manufacturer, model) {
  const prefixes = ['My', 'Personal', 'Work', 'Old', 'New', 'Backup', 'Spare'];
  const suffix = randomElement(prefixes);
  return `${suffix} ${manufacturer} ${model}`.trim();
}

/**
 * Generate a random MAC address
 * @returns {string} - Random MAC address
 */
function generateMacAddress() {
  return Array.from({ length: 6 }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join(':');
}

/**
 * Generate a random IP address
 * @returns {string} - Random IP address
 */
function generateIpAddress() {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 255) + 1).join('.');
}

/**
 * Seed test devices
 * @param {number} count - Number of devices to create
 * @param {Array} users - Array of user objects to associate with devices
 * @param {Object} [transaction=null] - Sequelize transaction
 * @returns {Promise<Array>} - Array of created devices
 */
async function seedTestDevices(count = 3, users = [], transaction = null) {
  const options = transaction ? { transaction } : {};
  const devices = [];
  
  // Users should be provided by the seedDevices function
  const userList = users;
  
  if (userList.length === 0) {
    logger.warn('[seed] No users provided for device creation');
    return [];
  }
  
  for (let i = 0; i < count; i++) {
    const manufacturer = randomElement(DEVICE_MANUFACTURERS);
    const model = randomElement(DEVICE_MODELS[manufacturer] || ['Unknown']);
    const deviceName = generateDeviceName(manufacturer, model);
    
    // Get a random user ID safely
    const randomUser = userList[Math.floor(Math.random() * userList.length)];
    if (!randomUser || !randomUser.id) {
      logger.warn(`[seed] Invalid user data, skipping device ${i + 1}`);
      continue;
    }
    const userId = randomUser.id;
    
    const result = await safeModelOperation(
      async () => {
        const device = await Device.create({
          deviceId: generateDeviceId(),
          userId,
          name: deviceName,
          model,
          manufacturer,
          os: 'Android',
          osVersion: randomElement(ANDROID_VERSIONS),
          isOnline: randomBool(),
          lastSeen: randomDate(nowMinus(30), new Date()),
          batteryLevel: randInt(10, 100),
          isCharging: randomBool(),
          macAddress: generateMacAddress(),
          ipAddress: generateIpAddress(),
          isRooted: randomBool(),
          isEmulator: false,
          screenResolution: `${randInt(720, 1440)}x${randInt(1280, 2960)}`,
          ram: randomElement([2, 3, 4, 6, 8, 12]) + 'GB',
          storage: randomElement([16, 32, 64, 128, 256, 512]) + 'GB',
          isActive: true,
          isMonitored: true,
          settings: {
            locationTracking: randomBool(),
            callLogs: randomBool(),
            smsLogs: randomBool(),
            appUsage: randomBool(),
            screenTime: randomBool(),
            notifications: randomBool()
          }
        }, options);
        
        logger.info(`[seed] Created test device: ${deviceName} (${device.deviceId})`);
        return device;
      },
      'Device',
      `Error creating test device ${i + 1}`
    );
    
    if (result.success) {
      devices.push(result.result);
    }
  }
  
  return devices;
}

/**
 * Main seed function for devices
 * @param {Object} [options={}] - Options for seeding
 * @param {number} [options.devicesCount=3] - Number of devices to create per user
 * @param {Array} [options.users=[]] - Array of user objects to associate with devices
 * @param {Object} [transaction=null] - Sequelize transaction
 * @returns {Promise<Object>} - Result of the operation
 */
async function seedDevices(options = {}, transaction = null) {
  const { devicesCount = 3, users = [] } = options;
  const dbOptions = transaction ? { transaction } : {};
  
  try {
    logger.info('[seed] Starting devices seeding...');
    
    // Get all users if none provided
    let userList = users;
    if (!userList || userList.length === 0) {
      const usersResult = await User.findAll({
        attributes: ['id'],
        ...dbOptions
      });
      userList = usersResult.map(u => u.get({ plain: true }));
      logger.info(`[seed] Found ${userList.length} users in the database`);
    }
    
    if (userList.length === 0) {
      throw new Error('No users found. Please seed users first.');
    }
    
    // Create test devices
    const devices = await seedTestDevices(devicesCount, userList, transaction);
    
    logger.info(`[seed] Successfully seeded ${devices.length} test devices`);
    
    return {
      success: true,
      devices,
      totalDevices: devices.length
    };
  } catch (error) {
    logger.error('[seed] Error in devices seeding:', error);
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
      
      // First, seed users if not already done
      const { seedUsers } = require('./01-users');
      const usersResult = await seedUsers({ testUsersCount: 2 });
      
      if (!usersResult.success) {
        throw new Error('Failed to seed users');
      }
      
      // Then seed devices
      const result = await seedDevices({ 
        devicesCount: 2,
        users: [usersResult.admin, ...usersResult.testUsers]
      });
      
      if (result.success) {
        logger.info('Devices seeding completed successfully');
        process.exit(0);
      } else {
        logger.error('Devices seeding failed');
        process.exit(1);
      }
    } catch (error) {
      logger.error('Error in devices seeding:', error);
      process.exit(1);
    }
  })();
}

// Export the seed function
module.exports = {
  seed: seedDevices,
  seedTestDevices,
  seedDevices
};
