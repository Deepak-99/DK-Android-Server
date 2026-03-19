'use strict';

const { sequelize, Contact, Device } = require('../config/database');
const { 
  safeModelOperation, 
  randomString,
  randomElement,
  randomBool,
  randomDate,
  nowMinus,
  sampleData,
  logger 
} = require('./_config');

/**
 * Generate a random phone number
 * @returns {string} - Random phone number
 */
function generatePhoneNumber() {
  const prefixes = ['+1', '+44', '+91', '+61', '+81'];
  const prefix = randomElement(prefixes);
  const number = Math.floor(1000000000 + Math.random() * 9000000000).toString().substring(0, 10);
  return `${prefix}${number}`;
}

/**
 * Generate a random email address
 * @param {string} name - Contact name
 * @returns {string} - Email address
 */
function generateEmail(name) {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'protonmail.com', 'icloud.com'];
  const [firstName, lastName] = name.toLowerCase().split(' ');
  const domain = randomElement(domains);
  return `${firstName}.${lastName}@${domain}`;
}

/**
 * Generate a random contact
 * @param {string} deviceId - Device ID to associate with the contact
 * @returns {Object} - Contact object
 */
function generateContact(deviceId) {
  const name = sampleData.generateName();
  const [givenName, ...familyNameParts] = name.split(' ');
  const familyName = familyNameParts.join(' ');
  const email = generateEmail(name);
  const phone = generatePhoneNumber();
  
  // Use the provided device ID (which should be the actual ID from the Device model)
  // The device ID should be a number within the BIGINT UNSIGNED range
  const safeDeviceId = deviceId;
  
  // Generate a unique contact ID
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 10000);
  const contactId = `contact_${timestamp}_${randomSuffix}`;
  
  return {
    device_id: safeDeviceId, // This should be the actual ID from the Device model
    contact_id: contactId,
    display_name: name,
    given_name: givenName,
    family_name: familyName || null,
    phone_numbers: [
      {
        number: phone,
        type: 'mobile',
        label: 'Mobile'
      }
    ],
    email_addresses: [
      {
        email: email,
        type: 'home',
        label: 'Home'
      }
    ],
    organization: randomBool(0.5) ? `${familyName || 'Tech'} Inc.` : null,
    job_title: randomBool(0.5) ? ['Developer', 'Manager', 'Designer', 'Engineer', 'Analyst'][Math.floor(Math.random() * 5)] : null,
    photo_uri: null,
    starred: randomBool(),
    times_contacted: Math.floor(Math.random() * 50),
    last_time_contacted: randomDate(nowMinus(365), new Date()),
    custom_ringtone: null,
    send_to_voicemail: false,
    notes: randomBool(0.7) ? `Notes for ${name}` : null,
    is_deleted: false,
    created_at: new Date(),
    updated_at: new Date()
  };
}

/**
 * Seed contacts for devices
 * @param {Array} devices - Array of device objects
 * @param {Object} [options={}] - Options for seeding
 * @param {number} [options.contactsPerDevice=10] - Number of contacts per device
 * @param {Object} [transaction=null] - Sequelize transaction
 * @returns {Promise<Array>} - Array of created contacts
 */
async function seedContacts(devices, options = {}, transaction = null) {
  const { contactsPerDevice = 10 } = options;
  const createdContacts = [];
  
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
    // Use the numeric ID from the Device model
    const deviceId = device.id;
    if (!deviceId) {
      logger.warn(`[seed] Device ${JSON.stringify(device)} has no valid ID, skipping`);
      continue;
    }
    
    logger.info(`[seed] Seeding ${contactsPerDevice} contacts for device ID: ${deviceId}`);
    
    for (let i = 0; i < contactsPerDevice; i++) {
      try {
        const contactData = generateContact(deviceId);
        
        // Log the contact data for debugging
        logger.debug(`[seed] Creating contact ${i + 1} for device ${deviceId}`, {
          device_id: contactData.device_id,
          contact_id: contactData.contact_id.substring(0, 20) + '...'
        });
        
        const result = await safeModelOperation(
          async () => {
            const contact = await Contact.create(contactData, {
              ...(transaction ? { transaction } : {})
            });
            
            logger.info(`[seed] Created contact: ${contact.display_name || contact.contact_id} for device ${deviceId}`);
            return contact;
          },
          'Contact',
          `Error creating contact ${i + 1} for device ${deviceId}`
        );
        
        if (result.success) {
          createdContacts.push(result.result);
        }
      } catch (error) {
        logger.error(`[seed] Error creating contact ${i + 1} for device ${deviceId}:`, error);
      }
  }
  
  return createdContacts;
}
}

/**
 * Main seed function for contacts
 * @param {Object} [options={}] - Options for seeding
 * @param {number} [options.contactsPerDevice=10] - Number of contacts per device
 * @param {Array} [devices=[]] - Array of device objects
 * @param {Object} [transaction=null] - Sequelize transaction
 * @returns {Promise<Object>} - Result of the operation
 */
async function seed(options = {}, devices = [], transaction = null) {
  const { contactsPerDevice = 10 } = options;
  
  try {
    logger.info('[seed] Starting contacts seeding...');
    
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
    
    const contacts = await seedContacts(deviceList, { contactsPerDevice }, transaction);
    
    logger.info(`[seed] Successfully seeded ${contacts.length} contacts across ${deviceList.length} devices`);
    
    return {
      success: true,
      contacts,
      totalContacts: contacts.length,
      devicesSeeded: deviceList.length
    };
  } catch (error) {
    logger.error('[seed] Error in contacts seeding:', error);
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
      
      // Then seed contacts
      const result = await seed({ contactsPerDevice: 5 }, devicesResult.devices);
      
      if (result.success) {
        logger.info('Contacts seeding completed successfully');
        process.exit(0);
      } else {
        logger.error('Contacts seeding failed');
        process.exit(1);
      }
    } catch (error) {
      logger.error('Error in contacts seeding:', error);
      process.exit(1);
    }
  })();
}

// Export the seed function
module.exports = {
  seed,
  seedContacts,
  generateContact
};
