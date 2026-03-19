'use strict';

const { sequelize, CallLog, Device, Contact } = require('../config/database');
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

// Call types and directions
const CALL_TYPES = ['INCOMING', 'OUTGOING', 'MISSED', 'REJECTED', 'BLOCKED'];
const CALL_DIRECTIONS = ['INBOUND', 'OUTBOUND'];

/**
 * Generate a random call log
 * @param {string} deviceId - Device ID
 * @param {Array} contacts - Array of contacts
 * @returns {Object} - Call log object
 */
function generateCallLog(deviceId, contacts = []) {
  const callType = randomElement(CALL_TYPES);
  const direction = randomElement(CALL_DIRECTIONS);
  const duration = randInt(0, 3600); // Up to 1 hour
  const now = new Date();
  const callDate = randomDate(nowMinus(30), now);
  
  // If we have contacts, use one of them, otherwise generate a random number
  let contact = null;
  let phoneNumber = '';
  let contactName = null;
  
  if (contacts.length > 0 && Math.random() > 0.3) {
    // 70% chance to use an existing contact
    contact = randomElement(contacts);
    // Get the first phone number from the contact's phone_numbers array
    const phoneNumberObj = contact.phone_numbers && contact.phone_numbers.length > 0 
      ? contact.phone_numbers[0] 
      : null;
      
    phoneNumber = phoneNumberObj ? phoneNumberObj.number : null;
    contactName = contact.display_name || 
                 (contact.given_name ? `${contact.given_name} ${contact.family_name || ''}`.trim() : null);
  }
  
  if (!phoneNumber) {
    // If no contact or no phone number, generate a random number
    const prefixes = ['+1', '+44', '+91', '+61', '+81'];
    const prefix = randomElement(prefixes);
    phoneNumber = `${prefix}${Math.floor(1000000000 + Math.random() * 9000000000).toString().substring(0, 10)}`;
  }
  
  // Generate a random call ID (mimicking Android's call log ID format)
  const callId = `call_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  
  return {
    device_id: deviceId,
    call_id: callId,
    number: phoneNumber,
    date: callDate,
    duration: duration,
    type: callType.toLowerCase(),
    name: contactName,
    number_type: 'mobile',
    number_label: 'Mobile',
    is_read: randomBool(0.8) ? 1 : 0, // 80% chance of being read
    is_new: randomBool(0.3) ? 1 : 0,  // 30% chance of being new
    sim_slot: randomElement([0, 1, null]),
    phone_account_id: randomString(10),
    transcription: randomBool(0.2) ? 'This is a sample call transcription.' : null,
    created_at: callDate,
    updated_at: callDate
  };
}

/**
 * Seed call logs for devices
 * @param {Array} devices - Array of device objects
 * @param {Object} [options={}] - Options for seeding
 * @param {number} [options.logsPerDevice=20] - Number of call logs per device
 * @param {Object} [transaction=null] - Sequelize transaction
 * @returns {Promise<Array>} - Array of created call logs
 */
async function seedCallLogs(devices, options = {}, transaction = null) {
  const { logsPerDevice = 20 } = options;
  const createdLogs = [];
  
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
    
    // Get contacts for this device
    const contacts = await Contact.findAll({
      where: { device_id: deviceId },
      attributes: ['id', 'display_name', 'given_name', 'family_name', 'phone_numbers'],
      ...(transaction ? { transaction } : {})
    });
    
    for (let i = 0; i < logsPerDevice; i++) {
      const callLogData = generateCallLog(deviceId, contacts);
      
      const result = await safeModelOperation(
        async () => {
          const log = await CallLog.create(callLogData, {
            ...(transaction ? { transaction } : {})
          });
          
          logger.debug(`[seed] Created call log: ${log.callType} call to ${log.phoneNumber} on device ${deviceId}`);
          return log;
        },
        'CallLog',
        `Error creating call log ${i + 1} for device ${deviceId}`
      );
      
      if (result.success) {
        createdLogs.push(result.result);
      }
    }
    
    logger.info(`[seed] Created ${logsPerDevice} call logs for device ${deviceId}`);
  }
  
  return createdLogs;
}

/**
 * Main seed function for call logs
 * @param {Object} [options={}] - Options for seeding
 * @param {number} [options.logsPerDevice=20] - Number of call logs per device
 * @param {Array} [devices=[]] - Array of device objects
 * @param {Object} [transaction=null] - Sequelize transaction
 * @returns {Promise<Object>} - Result of the operation
 */
async function seed(options = {}, devices = [], transaction = null) {
  const { logsPerDevice = 20 } = options;
  
  try {
    logger.info('[seed] Starting call logs seeding...');
    
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
    
    const callLogs = await seedCallLogs(deviceList, { logsPerDevice }, transaction);
    
    logger.info(`[seed] Successfully seeded ${callLogs.length} call logs across ${deviceList.length} devices`);
    
    return {
      success: true,
      callLogs,
      totalCallLogs: callLogs.length,
      devicesSeeded: deviceList.length
    };
  } catch (error) {
    logger.error('[seed] Error in call logs seeding:', error);
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
      
      // First, seed users, devices, and contacts if not already done
      const { seedUsers } = require('./01-users');
      const { seedDevices } = require('./02-devices');
      const { seed: seedContacts } = require('./03-contacts');
      
      const usersResult = await seedUsers({ testUsersCount: 1 });
      if (!usersResult.success) {
        throw new Error('Failed to seed users');
      }
      
      const devicesResult = await seedDevices({ devicesCount: 1, users: [usersResult.admin] });
      if (!devicesResult.success) {
        throw new Error('Failed to seed devices');
      }
      
      // Seed some contacts first
      const contactsResult = await seedContacts({ contactsPerDevice: 10 }, devicesResult.devices);
      if (!contactsResult.success) {
        throw new Error('Failed to seed contacts');
      }
      
      // Then seed call logs
      const result = await seed({ logsPerDevice: 10 }, devicesResult.devices);
      
      if (result.success) {
        logger.info('Call logs seeding completed successfully');
        process.exit(0);
      } else {
        logger.error('Call logs seeding failed');
        process.exit(1);
      }
    } catch (error) {
      logger.error('Error in call logs seeding:', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  seedCallLogs,
  seed
};
