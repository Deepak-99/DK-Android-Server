'use strict';

const { sequelize, SMS, Device, Contact } = require('../config/database');
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

// SMS types and statuses
const SMS_TYPES = ['INBOX', 'SENT', 'DRAFT', 'OUTBOX', 'FAILED', 'QUEUED'];
const SMS_STATUS = ['NONE', 'COMPLETE', 'PENDING', 'FAILED'];

// Sample SMS messages
const SAMPLE_MESSAGES = [
  "Hey, how are you doing?",
  "Can we meet tomorrow?",
  "I'll be there in 10 minutes",
  "Please call me when you get this",
  "Thanks for your message!",
  "What time is the meeting?",
  "I'm running late, sorry!",
  "Did you see the news?",
  "Let's catch up soon!",
  "Can you send me the details?",
  "I'll get back to you soon",
  "Happy birthday! 🎉",
  "See you later!",
  "What's the plan for today?",
  "Call me when you can"
];

/**
 * Generate a random SMS message
 * @param {string} deviceId - Device ID
 * @param {Array} contacts - Array of contacts
 * @returns {Object} - SMS message object
 */
function generateSMS(deviceId, contacts = []) {
  const type = randomElement(SMS_TYPES);
  const isIncoming = ['INBOX', 'FAILED'].includes(type);
  const now = new Date();
  const messageDate = randomDate(nowMinus(30), now);
  
  // If we have contacts, use one of them, otherwise generate a random number
  let contact = null;
  let address = '';
  
  if (contacts.length > 0 && Math.random() > 0.3) {
    // 70% chance to use an existing contact
    contact = randomElement(contacts);
    address = contact.phone;
  } else {
    // 30% chance to use a random number
    const prefixes = ['+1', '+44', '+91', '+61', '+81'];
    const prefix = randomElement(prefixes);
    address = `${prefix}${Math.floor(1000000000 + Math.random() * 9000000000).toString().substring(0, 10)}`;
  }
  
  // Generate message body
  let body = '';
  const numMessages = randInt(1, 3); // 1-3 message parts
  
  for (let i = 0; i < numMessages; i++) {
    body += (i > 0 ? ' ' : '') + randomElement(SAMPLE_MESSAGES);
  }
  
  // Generate a thread ID based on the address to group messages
  const threadId = Math.abs(address.split('').reduce((hash, char) => {
    return ((hash << 5) - hash) + char.charCodeAt(0);
  }, 0)) % 1000 + 1; // Ensure threadId is between 1-1000
  
  return {
    device_id: deviceId, // This should be the numeric device ID
    address,
    contact_name: contact ? (contact.display_name || `${contact.given_name || ''} ${contact.family_name || ''}`.trim()) : null,
    contact_id: contact ? contact.id : null,
    body,
    type,
    status: randomElement(SMS_STATUS),
    is_read: randomBool(0.8) ? 1 : 0, // 80% chance of being read
    is_seen: randomBool(0.9) ? 1 : 0, // 90% chance of being seen
    date: messageDate,
    date_sent: isIncoming ? messageDate : randomDate(messageDate, now),
    is_locked: randomBool(0.1) ? 1 : 0, // 10% chance of being locked
    sub_id: randInt(1, 3), // SIM slot
    error_code: randomBool(0.9) ? 0 : randInt(1, 100), // 10% chance of error
    creator: isIncoming ? address : 'me',
    thread_id: threadId,
    created_at: messageDate,
    updated_at: now
  };
}

/**
 * Seed SMS messages for devices
 * @param {Array} devices - Array of device objects
 * @param {Object} [options={}] - Options for seeding
 * @param {number} [options.messagesPerDevice=30] - Number of SMS messages per device
 * @param {Object} [transaction=null] - Sequelize transaction
 * @returns {Promise<Array>} - Array of created SMS messages
 */
async function seedSMS(devices, options = {}, transaction = null) {
  const { messagesPerDevice = 30 } = options;
  const createdMessages = [];
  
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
      where: { device_id: device.id }, // Use device.id (BIGINT) instead of deviceId (STRING)
      attributes: ['id', 'display_name', 'given_name', 'family_name', 'phone_numbers'],
      raw: true,
      ...(transaction ? { transaction } : {})
    });
    
    // Process contacts to extract the first phone number
    const processedContacts = contacts.map(contact => {
      const phoneNumber = contact.phone_numbers && contact.phone_numbers.length > 0 
        ? contact.phone_numbers[0].number 
        : null;
      return {
        id: contact.id,
        display_name: contact.display_name,
        given_name: contact.given_name,
        family_name: contact.family_name,
        phone: phoneNumber
      };
    });
    
    // Create a thread of messages for each contact
    const threads = [];
    const threadsCount = Math.min(processedContacts.length || 5, 10); // Up to 10 threads
    
    // Create thread IDs
    for (let i = 0; i < threadsCount; i++) {
      threads.push({
        contact: processedContacts[i] || null,
        messageCount: randInt(1, Math.ceil(messagesPerDevice / threadsCount)),
        lastMessageDate: randomDate(nowMinus(30), new Date())
      });
    }
    
    // Generate messages for each thread
    for (const thread of threads) {
      const threadContacts = thread.contact ? [thread.contact] : [];
      
      for (let i = 0; i < thread.messageCount; i++) {
        const isIncoming = randomBool();
        const smsData = generateSMS(
          deviceId,
          threadContacts
        );
        
        // Force thread consistency
        smsData.threadId = threads.indexOf(thread) + 1;
        smsData.type = isIncoming ? 'INBOX' : 'SENT';
        smsData.date = new Date(thread.lastMessageDate.getTime() - (thread.messageCount - i) * 3600000);
        
        const result = await safeModelOperation(
          async () => {
            const message = await SMS.create(smsData, {
              ...(transaction ? { transaction } : {})
            });
            
            logger.debug(`[seed] Created SMS: ${message.type} message to ${message.address} on device ${deviceId}`);
            return message;
          },
          'SMS',
          `Error creating SMS message for device ${deviceId}`
        );
        
        if (result.success) {
          createdMessages.push(result.result);
        }
      }
    }
    
    logger.info(`[seed] Created ${threads.reduce((sum, t) => sum + t.messageCount, 0)} SMS messages for device ${deviceId}`);
  }
  
  return createdMessages;
}

/**
 * Main seed function for SMS messages
 * @param {Object} [options={}] - Options for seeding
 * @param {number} [options.messagesPerDevice=30] - Number of SMS messages per device
 * @param {Array} [devices=[]] - Array of device objects
 * @param {Object} [transaction=null] - Sequelize transaction
 * @returns {Promise<Object>} - Result of the operation
 */
async function seed(options = {}, devices = [], transaction = null) {
  const { messagesPerDevice = 30 } = options;
  
  try {
    logger.info('[seed] Starting SMS messages seeding...');
    
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
    
    const messages = await seedSMS(deviceList, { messagesPerDevice }, transaction);
    
    logger.info(`[seed] Successfully seeded ${messages.length} SMS messages across ${deviceList.length} devices`);
    
    return {
      success: true,
      messages,
      totalMessages: messages.length,
      devicesSeeded: deviceList.length
    };
  } catch (error) {
    logger.error('[seed] Error in SMS messages seeding:', error);
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
      
      // Then seed SMS messages
      const result = await seed({ messagesPerDevice: 20 }, devicesResult.devices);
      
      if (result.success) {
        logger.info('SMS messages seeding completed successfully');
        process.exit(0);
      } else {
        logger.error('SMS messages seeding failed');
        process.exit(1);
      }
    } catch (error) {
      logger.error('Error in SMS messages seeding:', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  seedSMS,
  seed
};
