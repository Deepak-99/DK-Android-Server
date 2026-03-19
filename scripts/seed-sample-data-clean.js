'use strict';

require('dotenv').config();
const { 
  sequelize, 
  Device, 
  Location, 
  MediaFile, 
  Contact, 
  SMS, 
  CallLog, 
  User, 
  AppUpdate, 
  Command, 
  DeviceInfo,
  AppInstallation,
  DynamicConfig
} = require('../config/database');
const { Op, QueryTypes } = require('sequelize');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Configure logging
const logger = console;

// Utility functions
const randBetween = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(randBetween(min, max + 1));
const randomBool = () => Math.random() > 0.5;
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const nowMinus = (minutes) => new Date(Date.now() - minutes * 60000);
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

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
async function upsert(Model, where, values) {
  try {
    const [instance, created] = await Model.findOrCreate({
      where,
      defaults: { ...where, ...values }
    });
    
    if (!created) {
      await instance.update(values);
    }
    
    return instance;
  } catch (error) {
    console.error(`[seed] Error in upsert for ${Model.name}:`, error.message);
    throw error;
  }
}

/**
 * Seed admin user
 */
async function seedAdmin(transaction = null) {
  try {
    logger.info('[seed] Seeding admin user...');
    
    const email = process.env.ADMIN_EMAIL || 'admin@hawkshaw.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@1234';
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { email },
      transaction
    });
    
    if (existingAdmin) {
      logger.info('[seed] Admin user already exists');
      return existingAdmin;
    }
    
    // Create admin user
    const admin = await User.create({
      username: 'admin',
      email,
      password,
      role: 'admin',
      is_active: true,
      email_verified: true,
      last_login: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });
    
    logger.info('[seed] Admin user created successfully');
    return admin;
  } catch (error) {
    logger.error('[seed] Error seeding admin user:', error);
    throw error;
  }
}

// Add other seed functions here...

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
          // ... rest of the device info object
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
 * Main seed function
 */
async function seed() {
  const transaction = await sequelize.transaction();
  
  try {
    logger.info('Starting database seeding...');
    
    // Seed admin user
    await seedAdmin(transaction);
    
    // Commit the transaction
    await transaction.commit();
    logger.info('Database seeding completed successfully!');
  } catch (error) {
    // Rollback the transaction in case of error
    await transaction.rollback();
    logger.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error in seed script:', error);
      process.exit(1);
    });
}

// Export functions for testing
module.exports = {
  seed,
  seedAdmin,
  // Export other seed functions as needed
};
