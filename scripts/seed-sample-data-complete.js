'use strict';

require('dotenv').config();
const path = require('path');

// Load environment variables
const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, '..', 'config', 'config.js'))[env];

// Initialize database connection
const { Sequelize } = require('sequelize');
let sequelize;

if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      ...config,
      logging: console.log, // Enable logging in development
    }
  );
}

// Import models
console.log('Loading models...');
let models;
try {
  models = require(path.join(__dirname, '..', 'models'));
  console.log('Models loaded successfully');
} catch (error) {
  console.error('Failed to load models:', error);
  process.exit(1);
}

// Safely destructure models with fallbacks
const { 
  Device, 
  User, 
  DeviceInfo = { findOrCreate: () => Promise.resolve([{}, true]) }, 
  Command = { create: () => Promise.resolve({}) },
  InstalledApp = { create: () => Promise.resolve({}) }
} = models;
const { Op, QueryTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Configure logging
const logger = {
  info: (...args) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}]`, ...args);
  },
  error: (...args) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}][ERROR]`, ...args);
  },
  warn: (...args) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}][WARN]`, ...args);
  }
};

// Utility functions
const randBetween = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(randBetween(min, max + 1));
const randomBool = () => Math.random() > 0.5;
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const nowMinus = (minutes) => new Date(Date.now() - minutes * 60000);
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Generate a random device ID
const generateDeviceId = () => `DEV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

// Hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Helper function to safely handle model operations
async function safeModelOperation(operation, modelName, errorMessage) {
  try {
    const result = await operation();
    return { success: true, result };
  } catch (error) {
    logger.error(`[seed] Error in ${modelName}: ${errorMessage}`, error.message);
    if (process.env.NODE_ENV === 'development') {
      logger.error(error.stack);
    }
    return { success: false, error };
  }
}

// Helper function to check if a table exists
async function tableExists(tableName) {
  try {
    await sequelize.getQueryInterface().describeTable(tableName);
    return true;
  } catch (error) {
    return false;
  }
}

// Helper function to upsert records
async function upsert(Model, where, values, transaction = null) {
  if (!Model || typeof Model.findOrCreate !== 'function') {
    logger.warn(`[seed] Invalid model provided to upsert function`);
    return null;
  }

  try {
    const options = { where };
    if (transaction) {
      options.transaction = transaction;
    }
    
    const [instance, created] = await Model.findOrCreate({
      ...options,
      defaults: { ...where, ...values }
    });
    
    if (!created && instance) {
      await instance.update(values, { transaction });
    }
    
    return instance;
  } catch (error) {
    logger.error(`[seed] Error in upsert for ${Model.name || 'unknown model'}:`, error.message);
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error details:', error);
    }
    throw error;
  }
}

/**
 * Seed admin user
 */
async function seedAdmin(transaction = null) {
  try {
    logger.info('[seed] Seeding admin user...');
    
    const adminData = {
      username: process.env.ADMIN_USERNAME || 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123', // Will be hashed by the model hook
      role: 'admin',
      isActive: true,
      lastLogin: new Date()
    };

    // First check if user exists
    const [admin, created] = await User.findOrCreate({
      where: { email: adminData.email },
      defaults: adminData,
      transaction
    });

    if (created) {
      logger.info(`[seed] Created admin user: ${adminData.email}`);
    } else {
      // Update existing admin but preserve the password if not provided
      if (!process.env.ADMIN_PASSWORD) {
        delete adminData.password; // Don't update password if not explicitly provided
      }
      await admin.update(adminData, { transaction });
      logger.info(`[seed] Updated existing admin user: ${adminData.email}`);
    }

    return admin;
  } catch (error) {
    logger.error('[seed] Error in admin user operation:', error);
    throw error;
  }
}

/**
 * Seed device information
 */
async function seedDeviceInfo(devices, transaction = null) {
  if (!DeviceInfo) {
    logger.warn('[seed] DeviceInfo model is not available. Skipping device info seeding.');
    return;
  }
  
  try {
    logger.info('[seed] Seeding device info...');
    const qi = sequelize.getQueryInterface();
    let successCount = 0;
    
    // Check if table exists first - handle case sensitivity
    const tables = await qi.showAllTables();
    const tableName = 'device_info';
    const tableExists = tables.some(t => {
      const table = typeof t === 'string' ? t : (t.tableName || '');
      return table.toLowerCase() === tableName.toLowerCase();
    });

    if (!tableExists) {
      logger.warn(`[seed] Table ${tableName} does not exist. Skipping device info seeding.`);
      return;
    }

    for (const d of devices) {
      try {
        // Check if device info already exists
        const [results] = await sequelize.query(
          'SELECT id FROM device_info WHERE device_id = ?',
          { replacements: [d.device_id], transaction }
        );
        
        if (results.length > 0) {
          logger.info(`[seed] Device info already exists for device ${d.device_id}`);
          continue; // Skip if already exists
        }
        
        const deviceInfo = {
          device_id: parseInt(d.device_id), // Ensure device_id is an integer
          hardware_info: {
            model: d.model || 'Pixel 6',
            manufacturer: d.manufacturer || 'Google',
            brand: 'Google',
            board: 'raven',
            bootloader: 'raven-1.1-8828342',
            device: 'raven',
            display: 'SD1A.210817.036',
            fingerprint: 'google/raven/raven:12/SD1A.210817.036/7805805:user/release-keys',
            hardware: 'raven',
            host: 'abhost',
            product: 'raven',
            serial: '8A2X11K1K',
            tags: 'release-keys',
            type: 'user',
            user: 'android-build',
            baseband: 'g5123b-97927-220505-B-8400691',
            boottime: '1234567890',
            cpu_abi: 'arm64-v8a',
            device_codename: 'raven',
            device_type: 'handset',
            hardware_serial: 'ABC123456789',
            has_notch: true,
            is_emulator: false,
            is_phone: true,
            is_tablet: false,
            is_tv: false,
            is_wear: false,
            kernel_version: '5.10.43-android12-9-00001-gf4b9b1a9a6d6'
          },
          software_info: {
            android_version: '12',
            api_level: 31,
            base_os: 'Android 12',
            build_id: 'SD1A.210817.036',
            codename: 'S',
            incremental: '7805805',
            preview_sdk_int: 0,
            release: '12',
            sdk_int: 31,
            security_patch: '2022-05-05',
            build_number: 'SQ1D.220205.004',
            build_tags: 'release-keys',
            build_type: 'user'
          },
          network_info: {
            ipv4: '192.168.1.100',
            ipv6: '2607:f8b0:4009:80b::200e',
            mac_address: '02:00:00:00:00:00',
            ssid: 'AndroidWifi',
            bssid: '02:00:00:00:00:00',
            link_speed: 65,
            network_id: 1,
            rssi: -50,
            is_connected: true,
            is_failover: false,
            is_roaming: false,
            network_type: 'WIFI',
            ssid_hidden: false,
            frequency: 2412
          },
          security_info: {
            is_encrypted: true,
            is_device_secure: true,
            is_screen_lock_enabled: true,
            is_trust_agents_enabled: false,
            is_keyguard_secure: true,
            is_keyguard_disabled: false,
            is_keyguard_requires_password: true
          },
          system_settings: {
            screen_timeout: 30000,
            screen_brightness: 128,
            screen_auto_rotate: true,
            screen_sleep_timeout: 30000,
            screen_off_timeout: 60000,
            font_scale: 1.0,
            transition_animation_scale: 1.0,
            window_animation_scale: 1.0
          },
          sensors: [
            {
              name: 'Accelerometer',
              vendor: 'Google Inc.',
              version: 1,
              type: 1,
              max_range: 39.2266,
              resolution: 0.0023956299,
              power: 0.13,
              min_delay: 5000
            },
            {
              name: 'Magnetometer',
              vendor: 'Google Inc.',
              version: 1,
              type: 2,
              max_range: 4912.0,
              resolution: 0.15,
              power: 0.5,
              min_delay: 10000
            },
            {
              name: 'Gyroscope',
              vendor: 'Google Inc.',
              version: 1,
              type: 4,
              max_range: 34.906586,
              resolution: 0.0010652645,
              power: 0.5,
              min_delay: 5000
            }
          ],
          permissions: [
            'android.permission.INTERNET',
            'android.permission.ACCESS_NETWORK_STATE',
            'android.permission.ACCESS_WIFI_STATE',
            'android.permission.READ_PHONE_STATE',
            'android.permission.READ_CONTACTS',
            'android.permission.READ_CALL_LOG',
            'android.permission.READ_SMS',
            'android.permission.ACCESS_FINE_LOCATION',
            'android.permission.CAMERA',
            'android.permission.RECORD_AUDIO',
            'android.permission.READ_EXTERNAL_STORAGE',
            'android.permission.WRITE_EXTERNAL_STORAGE'
          ],
          last_updated: new Date()
        };

        await DeviceInfo.create(deviceInfo, { transaction });
        successCount++;
        logger.info(`[seed] Device info created for device ${d.device_id}`);
      } catch (error) {
        logger.error(`[seed] Error inserting device info for ${d.device_id}:`, error);
      }
    }

    if (successCount > 0) {
      logger.info(`[seed] Device info created for ${successCount} devices`);
    } else {
      logger.warn('[seed] No device info was created. Check the device_info table schema and data.');
    }
    
    return successCount;
  } catch (error) {
    logger.error('[seed] Error in seedDeviceInfo:', error);
    throw error;
  }
}

/**
 * Seed commands for devices
 */
async function seedCommands(devices, transaction = null) {
  if (!Command) {
    logger.warn('[seed] Command model is not available. Skipping commands seeding.');
    return;
  }
  
  try {
    logger.info('[seed] Seeding commands...');
    const qi = sequelize.getQueryInterface();
    let successCount = 0;
    
    // Check if table exists first
    const tables = await qi.showAllTables();
    const tableName = 'commands';
    const tableExists = tables.some(t => 
      (typeof t === 'string' && t === tableName) ||
      (typeof t === 'object' && t.tableName === tableName)
    );

    if (!tableExists) {
      logger.warn(`[seed] Table ${tableName} does not exist. Skipping commands seeding.`);
      return;
    }

    for (const d of devices) {
      const commands = [
        { 
          device_id: d.device_id,
          command_type: 'PING', 
          status: 'pending', 
          parameters: { interval: 60 },
          expires_at: new Date(Date.now() + 3600000) // 1 hour from now
        },
        { 
          device_id: d.device_id,
          command_type: 'SYNC_CONTACTS', 
          status: 'sent', 
          parameters: { full_sync: true },
          expires_at: new Date(Date.now() + 86400000) // 24 hours from now
        },
        { 
          device_id: d.device_id,
          command_type: 'CAPTURE_SCREENSHOT', 
          status: 'completed', 
          parameters: { quality: 'high' },
          result: 'Screenshot captured successfully',
          expires_at: new Date(Date.now() + 3600000) // 1 hour from now
        },
        { 
          device_id: d.device_id,
          command_type: 'START_RECORDING', 
          status: 'failed', 
          parameters: { duration: 300, quality: 'high' },
          result: 'Failed to start recording: Microphone permission denied',
          expires_at: new Date(Date.now() - 3600000) // Expired 1 hour ago
        }
      ];

      for (const cmd of commands) {
        try {
          // Check if command already exists
          const [results] = await sequelize.query(
            'SELECT id FROM commands WHERE device_id = ? AND command_type = ?',
            { 
              replacements: [cmd.device_id, cmd.command_type],
              transaction
            }
          );
          
          if (results.length > 0) {
            logger.info(`[seed] Command ${cmd.command_type} already exists for device ${cmd.device_id}`);
            continue; // Skip if already exists
          }
          
          // Insert new command
          await qi.bulkInsert('commands', [{
            ...cmd,
            parameters: JSON.stringify(cmd.parameters),
            created_at: new Date(),
            updated_at: new Date()
          }], { transaction });
          
          successCount++;
          logger.info(`[seed] Created command ${cmd.command_type} for device ${cmd.device_id}`);
        } catch (error) {
          logger.error(`[seed] Error inserting command ${cmd.command_type} for device ${cmd.device_id}:`, error);
        }
      }
    }

    if (successCount > 0) {
      logger.info(`[seed] Created ${successCount} commands`);
    } else {
      logger.warn('[seed] No commands were created. Check the commands table schema and data.');
    }
    
    return successCount;
  } catch (error) {
    logger.error('[seed] Error in seedCommands:', error);
    throw error;
  }
}

/**
 * Seed test devices
 */
async function seedDevices(adminUser, transaction = null) {
  try {
    logger.info('[seed] Seeding devices...');
    
    const devices = [
      {
        deviceId: 'DEVICE-ALPHA-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        name: 'Test Device Alpha',
        model: 'Pixel 6',
        manufacturer: 'Google',
        os: 'Android',
        osVersion: '13',
        imei: '35' + Math.floor(Math.random() * 10000000000000).toString().padStart(13, '0'),
        phoneNumber: `+1${Math.floor(2000000000 + Math.random() * 8000000000)}`,
        status: 'active',
        isOnline: true,
        lastSeen: new Date(),
        registrationDate: new Date(),
        appVersion: '1.0.0',
        batteryLevel: Math.floor(Math.random() * 100),
        isCharging: Math.random() > 0.5,
        networkType: ['wifi', 'cellular', 'ethernet', 'unknown'][Math.floor(Math.random() * 4)],
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        macAddress: Array.from({length: 6}, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':'),
        locationEnabled: true,
        cameraEnabled: true,
        microphoneEnabled: true,
        settings: JSON.stringify({
          notifications: true,
          autoUpdate: true,
          syncInterval: 15,
          lastSync: new Date().toISOString(),
          features: {
            remoteControl: true,
            autoBackup: true,
            locationTracking: true
          }
        })
      },
      {
        deviceId: 'DEVICE-BETA-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        name: 'Test Device Beta',
        model: 'Galaxy S22',
        manufacturer: 'Samsung',
        os: 'Android',
        osVersion: '12',
        imei: '35' + Math.floor(Math.random() * 10000000000000).toString().padStart(13, '0'),
        phoneNumber: `+1${Math.floor(2000000000 + Math.random() * 8000000000)}`,
        status: 'active',
        isOnline: false,
        lastSeen: new Date(Date.now() - 86400000), // 1 day ago
        registrationDate: new Date(),
        appVersion: '1.0.0',
        batteryLevel: Math.floor(Math.random() * 100),
        isCharging: Math.random() > 0.5,
        networkType: ['wifi', 'cellular', 'ethernet', 'unknown'][Math.floor(Math.random() * 4)],
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        macAddress: Array.from({length: 6}, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':'),
        locationEnabled: true,
        cameraEnabled: false,
        microphoneEnabled: true,
        settings: JSON.stringify({
          notifications: true,
          autoUpdate: false,
          syncInterval: 30,
          lastSync: new Date(Date.now() - 86400000).toISOString(),
          features: {
            remoteControl: true,
            autoBackup: false,
            locationTracking: true
          }
        })
      }
    ];

    const createdDevices = [];
    for (const deviceData of devices) {
      try {
        // Check if device exists by deviceId or IMEI
        const [device, created] = await Device.findOrCreate({
          where: {
            [Op.or]: [
              { deviceId: deviceData.deviceId },
              { imei: deviceData.imei }
            ]
          },
          defaults: {
            ...deviceData,
            userId: adminUser.id // Associate with admin user
          },
          transaction
        });

        if (!created) {
          // Update existing device but preserve deviceId and imei
          const { deviceId, imei, ...updateData } = deviceData;
          await device.update(updateData, { transaction });
          logger.info(`[seed] Updated device: ${device.name} (${device.deviceId})`);
        } else {
          logger.info(`[seed] Created device: ${device.name} (${device.deviceId})`);
        }
        
        createdDevices.push(device);
      } catch (error) {
        logger.error(`[seed] Error processing device ${deviceData.deviceId || 'unknown'}:`, error);
        // Continue with next device instead of failing the entire process
        continue;
      }
    }

    if (createdDevices.length === 0) {
      throw new Error('Failed to create any devices');
    }

    return createdDevices;
  } catch (error) {
    logger.error('[seed] Error seeding devices:', error);
    throw error;
  }
}

/**
 * Check if data already exists in the database
 */
async function dataExists(transaction) {
  try {
    logger.info('Checking if users table exists...');
    const [userTables] = await sequelize.query("SHOW TABLES LIKE 'users'");
    
    if (userTables.length === 0) {
      logger.info('Users table does not exist, assuming empty database');
      return false;
    }
    
    logger.info('Counting users...');
    const [userCount] = await sequelize.query(
      'SELECT COUNT(*) as count FROM users',
      { type: QueryTypes.SELECT, transaction }
    );
    
    logger.info('Checking if devices table exists...');
    const [deviceTables] = await sequelize.query("SHOW TABLES LIKE 'devices'");
    
    if (deviceTables.length === 0) {
      logger.info('Devices table does not exist, assuming empty database');
      return false;
    }
    
    logger.info('Counting devices...');
    const [deviceCount] = await sequelize.query(
      'SELECT COUNT(*) as count FROM devices',
      { type: QueryTypes.SELECT, transaction }
    );
    
    const exists = (parseInt(userCount.count) > 0) || (parseInt(deviceCount.count) > 0);
    logger.info(`Data exists check: ${exists} (Users: ${userCount.count}, Devices: ${deviceCount.count})`);
    
    return exists;
  } catch (error) {
    logger.warn('Error checking for existing data, assuming empty database:', error.message);
    return false;
  }
}

/**
 * Seed app installations for devices
 */
async function seedAppInstallations(devices, transaction = null) {
  try {
    logger.info('[seed] Seeding installed apps...');
    
    if (!InstalledApp) {
      logger.warn('[seed] InstalledApp model not available. Skipping app installations.');
      return [];
    }
    
    const appPackages = [
      // WhatsApp
      {
        package_name: 'com.whatsapp',
        app_name: 'WhatsApp',
        version_name: '2.22.25.81',
        version_code: 234214010,
        install_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        update_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),  // 7 days ago
        is_system_app: false,
        is_enabled: true
      },
      // Facebook
      {
        package_name: 'com.facebook.katana',
        app_name: 'Facebook',
        version_name: '400.0.0.28.119',
        version_code: 4000028119,
        install_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        update_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        is_system_app: false,
        is_enabled: true
      },
      // Gmail
      {
        package_name: 'com.google.android.gm',
        app_name: 'Gmail',
        version_name: '2022.11.06.484975143',
        version_code: 484975143,
        install_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        update_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),  // 5 days ago
        is_system_app: true,
        is_enabled: true
      },
      // YouTube
      {
        package_name: 'com.google.android.youtube',
        app_name: 'YouTube',
        version_name: '17.45.36',
        version_code: 116701233,
        install_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        update_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),  // 3 days ago
        is_system_app: true,
        is_enabled: true
      },
      // Instagram
      {
        package_name: 'com.instagram.android',
        app_name: 'Instagram',
        version_name: '250.0.0.21.109',
        version_code: 2500021109,
        install_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        update_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),  // 2 days ago
        is_system_app: false,
        is_enabled: true
      },
      // Chrome
      {
        package_name: 'com.android.chrome',
        app_name: 'Chrome',
        version_name: '107.0.5304.105',
        version_code: 530410551,
        install_date: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
        update_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),   // 1 day ago
        is_system_app: true,
        is_enabled: true
      },
      // Amazon Shopping
      {
        package_name: 'com.amazon.mShop.android.shopping',
        app_name: 'Amazon Shopping',
        version_name: '23.24.0.100',
        version_code: 232401000,
        install_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        update_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),  // 4 days ago
        is_system_app: false,
        is_enabled: true
      },
      // Uber Eats
      {
        package_name: 'com.ubercab.eats',
        app_name: 'Uber Eats',
        version_name: '6.333.10001',
        version_code: 633310001,
        install_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        update_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),  // 2 days ago
        is_system_app: false,
        is_enabled: true
      },
      // Google Maps
      {
        package_name: 'com.google.android.apps.maps',
        app_name: 'Google Maps',
        version_name: '11.67.1',
        version_code: 116701233,
        install_date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
        update_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),   // 1 day ago
        is_system_app: true,
        is_enabled: true
      },
      // Spotify
      {
        package_name: 'com.spotify.music',
        app_name: 'Spotify',
        version_name: '8.7.78.1211',
        version_code: 8781211,
        install_date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        update_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),  // 1 day ago
        is_system_app: false,
        is_enabled: true
      }
    ];

    const installedApps = [];
    
    for (const device of devices) {
      for (const app of appPackages) {
        try {
          const installedApp = await InstalledApp.create({
            deviceId: device.deviceId,
            packageName: app.package_name,
            appName: app.app_name,
            versionName: app.version_name,
            versionCode: app.version_code,
            installTime: app.install_date,
            updateTime: app.update_date,
            isSystemApp: app.is_system_app,
            isEnabled: app.is_enabled,
            firstInstallTime: app.install_date,
            lastUpdateTime: app.update_date
          }, { transaction });
          
          installedApps.push(installedApp);
          logger.info(`[seed] Added ${app.app_name} to device ${device.deviceId}`);
        } catch (error) {
          if (error.name === 'SequelizeUniqueConstraintError') {
            logger.info(`[seed] ${app.app_name} already exists for device ${device.deviceId}`);
          } else {
            logger.error(`[seed] Error adding ${app.app_name} to device ${device.deviceId}:`, error);
          }
        }
      }
    }
    
    logger.info(`[seed] Seeded ${installedApps.length} installed apps`);
    return installedApps;
  } catch (error) {
    logger.error('[seed] Error in seedAppInstallations:', error);
    throw error;
  }
}

/**
 * Main seed function
 */
async function seed(force = false) {
  const startTime = Date.now();
  logger.info('Starting database seeding process...');
  
  let transaction;
  try {
    // Test database connection first
    logger.info('Testing database connection...');
    await sequelize.authenticate();
    logger.info('✓ Database connection established successfully');
    
    // Start transaction
    transaction = await sequelize.transaction();
    logger.info('✓ Database transaction started');
    
    // Check if data already exists
    logger.info('Checking for existing data...');
    const exists = await dataExists(transaction);
    
    if (!force && exists) {
      logger.info('Database already contains data. Use --force to re-seed.');
      await transaction.rollback();
      return { 
        skipped: true, 
        message: 'Database already contains data. Use --force to re-seed.',
        timestamp: new Date().toISOString()
      };
    }
    
    logger.info('No existing data found. Starting seeding process...');
    
    // 1. Seed admin user
    logger.info('\n=== Seeding Admin User ===');
    const adminUser = await seedAdmin(transaction);
    logger.info(`✓ Admin user processed: ${adminUser.email}`);
    
    // 2. Seed devices (and associate with admin user)
    logger.info('\n=== Seeding Devices ===');
    const devices = await seedDevices(adminUser, transaction);
    logger.info(`✓ Seeded ${devices.length} devices`);
    
    // 3. Seed additional data if needed
    if (devices && devices.length > 0) {
      try {
        logger.info('\n=== Seeding Additional Data ===');
        await seedDeviceInfo(devices, transaction);
        await seedCommands(devices, transaction);
        await seedAppInstallations(devices, transaction);
        logger.info('✓ Additional data seeded successfully');
      } catch (error) {
        logger.warn('Error seeding additional data, but continuing:', error.message);
        // Continue even if additional data seeding fails
      }
    }
    
    // Commit the transaction
    await transaction.commit();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logger.info('\n=== Seeding Completed Successfully ===');
    logger.info(`✓ Total time: ${duration}s`);
    logger.info('✓ Transaction committed');
    
    return { 
      success: true, 
      message: `Seeding completed successfully in ${duration} seconds`,
      timestamp: new Date().toISOString(),
      stats: {
        users: 1, // admin user
        devices: devices.length,
        duration: `${duration}s`
      }
    };
    
  } catch (error) {
    // Rollback the transaction in case of error
    if (transaction) {
      try {
        await transaction.rollback();
        logger.info('Transaction rolled back due to error');
      } catch (rollbackError) {
        logger.error('Error during transaction rollback:', rollbackError);
      }
    }
    
    logger.error('❌ Error during database seeding:', error);
    throw error;
    
  } finally {
    // Close the connection
    try {
      await sequelize.close();
      logger.info('Database connection closed');
    } catch (closeError) {
      logger.error('Error closing database connection:', closeError);
    }
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  logger.info('Starting seed script...');
  
  // Parse command line arguments
  const force = process.argv.includes('--force');
  if (force) {
    logger.info('Force flag detected - will overwrite existing data');
  }
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  seed(force)
    .then((result) => {
      if (result && result.skipped) {
        logger.info(result.message);
      } else if (result) {
        logger.info(`Seeding completed at ${result.timestamp}`);
      } else {
        logger.info('Seeding completed successfully');
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('Error in seed script:', error);
      process.exit(1);
    });
}

// Export functions for testing
module.exports = {
  seed,
  seedAdmin,
  seedDevices
};
