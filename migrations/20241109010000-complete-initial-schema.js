'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // ======================
      // 1. Core Tables
      // ======================
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
      await queryInterface.createTable('devices', {
        id: {
          type: Sequelize.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        deviceId: {
          type: 'VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
          allowNull: false,
          unique: true,
          field: 'deviceId'
        },
        name: { type: Sequelize.STRING, allowNull: true },
        nickname: { type: Sequelize.STRING(255), allowNull: true },
        model: { type: Sequelize.STRING, allowNull: true },
        manufacturer: { type: Sequelize.STRING, allowNull: true },
        os: { type: Sequelize.STRING, allowNull: true },
        osVersion: { type: Sequelize.STRING, allowNull: true },
        isOnline: { type: Sequelize.BOOLEAN, defaultValue: false },
        lastSeen: { type: Sequelize.DATE, allowNull: true },
        imei: { type: Sequelize.STRING, allowNull: true },
        userId: {
          type: Sequelize.INTEGER,  // Changed from INTEGER.UNSIGNED to INTEGER to match users.id
          allowNull: true,
          comment: 'Reference to users table (signed integer to match users.id)'
          // We'll add the foreign key constraint later
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Timestamp for soft deletes'
        },
        ipAddress: {
          type: Sequelize.STRING(45),
          field: 'ip_address',
          allowNull: true,
          comment: 'Last known IP address of the device'
        },
        macAddress: {
          type: Sequelize.STRING(17),
          field: 'macAddress',
          allowNull: true,
          comment: 'MAC address of the device'
        },
        settings: {
          type: Sequelize.TEXT,
          field: 'settings',
          allowNull: true,
          comment: 'Device settings in JSON format'
        },
        status: {
          type: Sequelize.ENUM('online', 'offline', 'active', 'inactive', 'suspended'),
          field: 'status',
          allowNull: false,
          defaultValue: 'offline',
          comment: 'Current status of the device'
        },
        phone_number: {
          type: Sequelize.STRING(20),
          field: 'phone_number',
          allowNull: true,
          comment: 'Phone number associated with the device'
        },
        registration_date: {
          type: Sequelize.DATE,
          field: 'registration_date',
          allowNull: true,
          comment: 'When the device was registered'
        },
        app_version: {
          type: Sequelize.STRING(50),
          field: 'app_version',
          allowNull: true,
          comment: 'Version of the app installed on the device'
        },
        battery_level: {
          type: Sequelize.INTEGER,
          field: 'battery_level',
          allowNull: true,
          comment: 'Current battery level (0-100)'
        },
        is_charging: {
          type: Sequelize.BOOLEAN,
          field: 'is_charging',
          allowNull: false,
          defaultValue: false,
          comment: 'Whether the device is currently charging'
        },
        network_type: {
          type: Sequelize.STRING(50),
          field: 'network_type',
          allowNull: true,
          comment: 'Type of network the device is connected to'
        },
        location_enabled: {
          type: Sequelize.BOOLEAN,
          field: 'location_enabled',
          allowNull: false,
          defaultValue: false,
          comment: 'Whether location services are enabled'
        },
        camera_enabled: {
          type: Sequelize.BOOLEAN,
          field: 'camera_enabled',
          allowNull: false,
          defaultValue: false,
          comment: 'Whether camera access is enabled'
        },
        microphone_enabled: {
          type: Sequelize.BOOLEAN,
          field: 'microphone_enabled',
          allowNull: false,
          defaultValue: false,
          comment: 'Whether microphone access is enabled'
        }
      }, { transaction });

      await queryInterface.createTable('users', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          comment: 'Primary key for the user record'
        },
        deviceId: {
          type: 'VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
          allowNull: true,
          field: 'deviceId',
          comment: 'Reference to the primary device associated with this user'
        },
        username: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
          comment: 'Unique username for login',
          validate: {
            len: [3, 50],
            is: /^[a-zA-Z0-9_]+$/
          }
        },
        email: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true,
          comment: 'User email address',
          validate: { 
            isEmail: {
              msg: 'Please provide a valid email address'
            },
            notEmpty: {
              msg: 'Email cannot be empty'
            }
          }
        },
        password: { 
          type: Sequelize.STRING(255), 
          allowNull: false,
          comment: 'Hashed password',
          validate: {
            notEmpty: {
              msg: 'Password cannot be empty'
            }
          }
        },
        role: {
          type: Sequelize.ENUM('admin', 'user'),
          defaultValue: 'user',
          allowNull: false,
          comment: 'User role for authorization'
        },
        isActive: { 
          type: Sequelize.BOOLEAN, 
          field: 'is_active',
          defaultValue: true,
          comment: 'Whether the user account is active'
        },
        lastLogin: { 
          type: Sequelize.DATE, 
          field: 'last_login',
          allowNull: true,
          comment: 'Timestamp of last successful login'
        },
        loginAttempts: {
          type: Sequelize.INTEGER,
          field: 'login_attempts',
          defaultValue: 0,
          comment: 'Number of failed login attempts'
        },
        lockedUntil: {
          type: Sequelize.DATE,
          field: 'locked_until',
          allowNull: true,
          comment: 'Account lock expiration time'
        },
        resetPasswordToken: {
          type: Sequelize.STRING,
          field: 'reset_password_token',
          allowNull: true,
          comment: 'Token for password reset'
        },
        resetPasswordExpires: {
          type: Sequelize.DATE,
          field: 'reset_password_expires',
          allowNull: true,
          comment: 'Expiration time for password reset token'
        },
        emailVerificationToken: {
          type: Sequelize.STRING,
          field: 'email_verification_token',
          allowNull: true,
          comment: 'Token for email verification'
        },
        emailVerified: {
          type: Sequelize.BOOLEAN,
          field: 'email_verified',
          defaultValue: false,
          comment: 'Whether the email has been verified'
        },
        twoFactorEnabled: {
          type: Sequelize.BOOLEAN,
          field: 'two_factor_enabled',
          defaultValue: false,
          comment: 'Whether two-factor authentication is enabled'
        },
        twoFactorSecret: {
          type: Sequelize.STRING,
          field: 'two_factor_secret',
          allowNull: true,
          comment: 'Secret for two-factor authentication'
        },
        preferences: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'User preferences stored as JSON'
        },
        lastIpAddress: {
          type: Sequelize.STRING(45),
          field: 'last_ip_address',
          allowNull: true,
          comment: 'Last known IP address of the user'
        },
        lastUserAgent: {
          type: Sequelize.TEXT,
          field: 'last_user_agent',
          allowNull: true,
          comment: 'Last known user agent string'
        },
        timezone: {
          type: Sequelize.STRING(50),
          allowNull: true,
          defaultValue: 'UTC',
          comment: 'User\'s preferred timezone'
        },
        locale: {
          type: Sequelize.STRING(10),
          allowNull: true,
          defaultValue: 'en-US',
          comment: 'User\'s preferred locale/language'
        },
        created_at: {
          type: Sequelize.DATE,
          field: 'created_at',
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'When the user account was created'
        },
        updated_at: {
          type: Sequelize.DATE,
          field: 'updated_at',
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          comment: 'When the user account was last updated'
        },
        deletedAt: {
          type: Sequelize.DATE,
          field: 'deleted_at',
          allowNull: true,
          comment: 'When the user account was soft deleted (if applicable)'
        }
      }, { transaction });

      // Add foreign key constraints after both tables exist
      // Add foreign key from devices.userId to users.id
      await queryInterface.addConstraint('devices', {
        fields: ['userId'],
        type: 'foreign key',
        name: 'devices_userId_fk',
        references: {
          table: 'users',
          field: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        transaction
      });

      await queryInterface.addConstraint('users', {
        fields: ['deviceId'],
        type: 'foreign key',
        name: 'users_deviceId_fk',
        references: {
          table: 'devices',
          field: 'deviceId'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        transaction
      });

      // Re-enable foreign key checks
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });

      // ======================
      // 3. Communication
      // ======================
      await queryInterface.createTable('call_logs', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        deviceId: {
          type: 'VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
          allowNull: false,
          field: 'deviceId',
          references: { 
            model: { tableName: 'devices' },
            key: 'deviceId'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          comment: 'Reference to devices table (deviceId)'
        },
        call_id: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'Call ID from Android device'
        },
        number: { 
          type: Sequelize.STRING, 
          // type: Sequelize.STRING(20),
          allowNull: false,
          field: 'number'
        },
        contactName: { type: Sequelize.STRING, allowNull: true },
        type: { 
          type: Sequelize.ENUM('incoming', 'outgoing', 'missed', 'voicemail', 'rejected', 'blocked'),
          allowNull: false,
          field: 'type'
        },
        duration: { type: Sequelize.INTEGER, defaultValue: 0 },
        date: { 
          type: Sequelize.DATE, 
          allowNull: false,
          field: 'date'
        },
        isRead: { type: Sequelize.BOOLEAN, defaultValue: false },
        sync_timestamp: { 
          type: Sequelize.DATE,
          allowNull: true,
          field: 'sync_timestamp',
          comment: 'Timestamp when the record was last synced'
        },
        created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });

      await queryInterface.createTable('call_recordings', {
        id: { 
          type: Sequelize.UUID, 
          defaultValue: Sequelize.UUIDV4, 
          primaryKey: true 
        },
        callLogId: {
          type: Sequelize.UUID,
          allowNull: true,
          field: 'call_log_id',
          references: { 
            model: { tableName: 'call_logs' },
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
          comment: 'Reference to call_logs table'
        },
        deviceId: {
          type: 'VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
          allowNull: false,
          field: 'deviceId',
          references: { 
            model: { tableName: 'devices' },
            key: 'deviceId'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          comment: 'Reference to devices table (deviceId)'
        },
        phone_number: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'Phone number of the call'
        },
        contact_name: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Contact name if available'
        },
        call_type: {
          type: Sequelize.ENUM('incoming', 'outgoing', 'missed', 'rejected', 'blocked'),
          allowNull: false,
          comment: 'Type of call'
        },
        call_direction: {
          type: Sequelize.ENUM('inbound', 'outbound'),
          allowNull: false,
          comment: 'Direction of the call'
        },
        upload_timestamp: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'When the recording was uploaded to server'
        },
        call_start_time: {
          type: Sequelize.DATE,
          allowNull: false,
          comment: 'When the call started'
        },
        call_end_time: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When the call ended'
        },
        call_duration: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Call duration in seconds'
        },
        recording_file_path: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'Path to the recorded call file on server'
        },
        recording_file_name: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'Original filename of the recording'
        },
        recording_file_size: {
          type: Sequelize.BIGINT,
          allowNull: true,
          comment: 'Size of recording file in bytes'
        },
        recording_duration: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Duration of recording in seconds'
        },
        recording_format: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'mp3',
          comment: 'Audio format (mp3, wav, m4a, etc.)'
        },
        recording_quality: {
          type: Sequelize.ENUM('low', 'medium', 'high'),
          allowNull: false,
          defaultValue: 'medium',
          comment: 'Recording quality'
        },
        recording_source: {
          type: Sequelize.ENUM('microphone', 'voice_call', 'voice_communication', 'voice_recognition'),
          allowNull: true,
          comment: 'Source of the recording'
        },
        transcription: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Text transcription of the call (if available)'
        },
        transcription_confidence: {
          type: Sequelize.FLOAT,
          allowNull: true,
          comment: 'Confidence score of transcription (0-1)'
        },
        sim_slot: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'SIM slot used for the call (0, 1, etc.)'
        },
        network_type: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Network type during call (2G, 3G, 4G, 5G, WiFi)'
        },
        call_state_changes: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Array of call state changes with timestamps'
        },
        is_processed: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Whether the recording has been processed/analyzed'
        },
        processing_status: {
          type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'),
          allowNull: false,
          defaultValue: 'pending',
          comment: 'Status of recording processing'
        },
        tags: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Tags for categorizing recordings'
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Admin notes about the recording'
        },
        is_important: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Whether this recording is marked as important'
        },
        is_deleted: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Soft delete flag'
        },
        is_uploaded: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Whether the recording has been uploaded to the server'
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Additional metadata about the recording'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'When the record was created'
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          comment: 'When the record was last updated'
        }
      }, { transaction });

      await queryInterface.createTable('contacts', {
        id: { 
          type: Sequelize.UUID, 
          defaultValue: Sequelize.UUIDV4, 
          primaryKey: true 
        },
        deviceId: {
          type: 'VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
          allowNull: false,
          field: 'deviceId',
          references: { 
            model: { tableName: 'devices' },
            key: 'deviceId'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          comment: 'Reference to the device this contact belongs to'
        },
        contact_id: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'Contact ID from Android device'
        },
        display_name: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Display name of the contact'
        },
        given_name: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Given (first) name of the contact'
        },
        family_name: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Family (last) name of the contact'
        },
        phone_numbers: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Array of phone number objects'
        },
        email_addresses: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Array of email address objects'
        },
        postal_addresses: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Array of postal address objects'
        },
        organization: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Organization name'
        },
        job_title: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Job title'
        },
        photo_uri: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'URI to the contact photo'
        },
        starred: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Whether the contact is starred/favorited'
        },
        times_contacted: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          comment: 'Number of times the contact has been contacted'
        },
        last_time_contacted: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Timestamp when the contact was last contacted'
        },
        custom_ringtone: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Custom ringtone for the contact'
        },
        send_to_voicemail: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Whether calls from this contact should go directly to voicemail'
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Additional notes about the contact'
        },
        sync_timestamp: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Timestamp of the last sync'
        },
        is_deleted: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Soft delete flag'
        },
        created_at: {
          type: Sequelize.DATE, 
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') 
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { 
        transaction,
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci' });

      await queryInterface.createTable('sms', {
        id: { 
          type: Sequelize.UUID, 
          defaultValue: Sequelize.UUIDV4, 
          primaryKey: true 
        },
        deviceId: {
          type: 'VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
          allowNull: false,
          field: 'deviceId',
          references: { 
            model: { tableName: 'devices' },
            key: 'deviceId'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          comment: 'Reference to devices table (deviceId)'
        },
        smsId: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
          comment: 'SMS ID from Android device'
        },
        threadId: { 
          type: Sequelize.STRING, 
          allowNull: true,
          comment: 'Conversation thread ID',
          index: true 
        },
        address: { 
          type: Sequelize.STRING, 
          allowNull: false,
          comment: 'Phone number or contact address',
          index: true
        },
        person: { 
          type: Sequelize.STRING, 
          allowNull: true,
          comment: 'Contact person ID' 
        },
        contactName: { 
          type: Sequelize.STRING, 
          allowNull: true,
          comment: 'Name of the contact' 
        },
        body: { 
          type: Sequelize.TEXT, 
          allowNull: true,
          comment: 'Message content' 
        },
        type: { 
          type: Sequelize.ENUM('inbox', 'sent', 'draft', 'outbox', 'failed', 'queued'),
          allowNull: false,
          comment: 'Type of message',
          index: true
        },
        read: { 
          type: Sequelize.BOOLEAN, 
          field: 'isRead',
          defaultValue: false,
          comment: 'Whether the message has been read' 
        },
        date: { 
          type: Sequelize.DATE, 
          allowNull: false,
          comment: 'Date SMS was sent/received',
          index: true
        },
        dateSent: { 
          type: Sequelize.DATE, 
          field: 'dateSent',
          allowNull: true,
          comment: 'Date SMS was sent (for sent messages)'
        },
        protocol: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Protocol identifier'
        },
        replyPathPresent: {
          type: Sequelize.BOOLEAN,
          field: 'replyPathPresent',
          defaultValue: false,
          comment: 'Whether reply path exists'
        },
        serviceCenter: {
          type: Sequelize.STRING,
          field: 'serviceCenter',
          allowNull: true,
          comment: 'Service center address'
        },
        isSeen: { 
          type: Sequelize.BOOLEAN, 
          field: 'isSeen',
          defaultValue: true,
          comment: 'Whether the message has been seen in the notification' 
        },
        isDeleted: {
          type: Sequelize.BOOLEAN,
          field: 'isDeleted',
          defaultValue: false,
          comment: 'Soft delete flag'
        },
        errorCode: {
          type: Sequelize.INTEGER,
          field: 'errorCode',
          allowNull: true,
          comment: 'Error code if message failed to send'
        },
        subscriptionId: {
          type: Sequelize.INTEGER,
          field: 'subscriptionId',
          allowNull: true,
          comment: 'SIM card subscription ID for multi-SIM devices'
        },
        creator: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Package name of the app that created the message'
        },
        isFavorite: {
          type: Sequelize.BOOLEAN,
          field: 'isFavorite',
          defaultValue: false,
          comment: 'Whether the message is marked as favorite'
        },
        isForwarded: {
          type: Sequelize.BOOLEAN,
          field: 'isForwarded',
          defaultValue: false,
          comment: 'Whether the message has been forwarded'
        },
        isReply: {
          type: Sequelize.BOOLEAN,
          field: 'isReply',
          defaultValue: false,
          comment: 'Whether this is a reply to another message'
        },
        isScheduled: {
          type: Sequelize.BOOLEAN,
          field: 'isScheduled',
          defaultValue: false,
          comment: 'Whether this is a scheduled message'
        },
        scheduledTime: {
          type: Sequelize.DATE,
          field: 'scheduledTime',
          allowNull: true,
          comment: 'When the message is scheduled to be sent'
        },
        isDelivered: {
          type: Sequelize.BOOLEAN,
          field: 'isDelivered',
          defaultValue: false,
          comment: 'Whether the message has been delivered'
        },
        isFailed: {
          type: Sequelize.BOOLEAN,
          field: 'isFailed',
          defaultValue: false,
          comment: 'Whether the message failed to send'
        },
        isPending: {
          type: Sequelize.BOOLEAN,
          field: 'isPending',
          defaultValue: false,
          comment: 'Whether the message is pending to be sent'
        },
        isDownloaded: {
          type: Sequelize.BOOLEAN,
          field: 'isDownloaded',
          defaultValue: true,
          comment: 'Whether the message has been downloaded from the server'
        },
        isLocked: {
          type: Sequelize.BOOLEAN,
          field: 'isLocked',
          defaultValue: false,
          comment: 'Whether the message is locked from deletion'
        },
        isReported: {
          type: Sequelize.BOOLEAN,
          field: 'isReported',
          defaultValue: false,
          comment: 'Whether the message has been reported as spam'
        },
        isPhishing: {
          type: Sequelize.BOOLEAN,
          field: 'isPhishing',
          defaultValue: false,
          comment: 'Whether the message has been detected as phishing'
        },
        isSpam: {
          type: Sequelize.BOOLEAN,
          field: 'isSpam',
          defaultValue: false,
          comment: 'Whether the message has been marked as spam'
        },
        isBlocked: {
          type: Sequelize.BOOLEAN,
          field: 'isBlocked',
          defaultValue: false,
          comment: 'Whether the sender is blocked'
        },
        isArchived: {
          type: Sequelize.BOOLEAN,
          field: 'isArchived',
          defaultValue: false,
          comment: 'Whether the message is archived'
        },
        isStarred: {
          type: Sequelize.BOOLEAN,
          field: 'isStarred',
          defaultValue: false,
          comment: 'Whether the message is starred'
        },
        isTrashed: {
          type: Sequelize.BOOLEAN,
          field: 'isTrashed',
          defaultValue: false,
          comment: 'Whether the message is in trash'
        },
        isUnread: {
          type: Sequelize.BOOLEAN,
          field: 'isUnread',
          defaultValue: true,
          comment: 'Whether the message is unread'
        },
        isVoiceMail: {
          type: Sequelize.BOOLEAN,
          field: 'isVoiceMail',
          defaultValue: false,
          comment: 'Whether this is a voicemail message'
        },
        isMMS: {
          type: Sequelize.BOOLEAN,
          field: 'isMMS',
          defaultValue: false,
          comment: 'Whether this is an MMS message'
        },
        isGroup: {
          type: Sequelize.BOOLEAN,
          field: 'isGroup',
          defaultValue: false,
          comment: 'Whether this is a group message'
        },
        isBroadcast: {
          type: Sequelize.BOOLEAN,
          field: 'isBroadcast',
          defaultValue: false,
          comment: 'Whether this is a broadcast message'
        },
        isEncrypted: {
          type: Sequelize.BOOLEAN,
          field: 'isEncrypted',
          defaultValue: false,
          comment: 'Whether the message is encrypted'
        },
        isSecure: {
          type: Sequelize.BOOLEAN,
          field: 'isSecure',
          defaultValue: false,
          comment: 'Whether the message is secure'
        },
        isSensitive: {
          type: Sequelize.BOOLEAN,
          field: 'isSensitive',
          defaultValue: false,
          comment: 'Whether the message contains sensitive content'
        },
        isSynced: {
          type: Sequelize.BOOLEAN,
          field: 'isSynced',
          defaultValue: false,
          comment: 'Whether the message has been synced with the server'
        },
        isUploaded: {
          type: Sequelize.BOOLEAN,
          field: 'isUploaded',
          defaultValue: false,
          comment: 'Whether the message has been uploaded to the server'
        },
        isVerified: {
          type: Sequelize.BOOLEAN,
          field: 'isVerified',
          defaultValue: false,
          comment: 'Whether the sender has been verified'
        },
        isWhitelisted: {
          type: Sequelize.BOOLEAN,
          field: 'isWhitelisted',
          defaultValue: false,
          comment: 'Whether the sender is whitelisted'
        },
        isBlacklisted: {
          type: Sequelize.BOOLEAN,
          field: 'isBlacklisted',
          defaultValue: false,
          comment: 'Whether the sender is blacklisted'
        },
        isBlockedContact: {
          type: Sequelize.BOOLEAN,
          field: 'isBlockedContact',
          defaultValue: false,
          comment: 'Whether the sender is in the blocked contacts list'
        },
        isEmergencyContact: {
          type: Sequelize.BOOLEAN,
          field: 'isEmergencyContact',
          defaultValue: false,
          comment: 'Whether the sender is an emergency contact'
        },
        isFavoriteContact: {
          type: Sequelize.BOOLEAN,
          field: 'isFavoriteContact',
          defaultValue: false,
          comment: 'Whether the sender is a favorite contact'
        },
        isPriority: {
          type: Sequelize.BOOLEAN,
          field: 'isPriority',
          defaultValue: false,
          comment: 'Whether the message is marked as priority'
        },
        isSilent: {
          type: Sequelize.BOOLEAN,
          field: 'isSilent',
          defaultValue: false,
          comment: 'Whether the message should be delivered silently'
        },
        isSnoozed: {
          type: Sequelize.BOOLEAN,
          field: 'isSnoozed',
          defaultValue: false,
          comment: 'Whether the message notification is snoozed'
        },
        isVibrate: {
          type: Sequelize.BOOLEAN,
          field: 'isVibrate',
          defaultValue: true,
          comment: 'Whether the message should vibrate when received'
        },
        isMuted: {
          type: Sequelize.BOOLEAN,
          field: 'isMuted',
          defaultValue: false,
          comment: 'Whether notifications for this thread are muted'
        },
        isPinned: {
          type: Sequelize.BOOLEAN,
          field: 'isPinned',
          defaultValue: false,
          comment: 'Whether the message is pinned in the conversation'
        },
        isReadReceiptRequested: {
          type: Sequelize.BOOLEAN,
          field: 'isReadReceiptRequested',
          defaultValue: false,
          comment: 'Whether a read receipt was requested for this message'
        },
        isReadReceiptSent: {
          type: Sequelize.BOOLEAN,
          field: 'isReadReceiptSent',
          defaultValue: false,
          comment: 'Whether a read receipt was sent for this message'
        },
        isDeliveryReceiptRequested: {
          type: Sequelize.BOOLEAN,
          field: 'isDeliveryReceiptRequested',
          defaultValue: false,
          comment: 'Whether a delivery receipt was requested for this message'
        },
        isDeliveryReceiptReceived: {
          type: Sequelize.BOOLEAN,
          field: 'isDeliveryReceiptReceived',
          defaultValue: false,
          comment: 'Whether a delivery receipt was received for this message'
        },
        messageClass: {
          type: Sequelize.ENUM('class1', 'class2', 'class3', 'class4'),
          field: 'messageClass',
          allowNull: true,
          comment: 'Message class for MMS messages'
        },
        messageType: {
          type: Sequelize.ENUM('text', 'image', 'video', 'audio', 'vcard', 'location', 'contact', 'document', 'unknown'),
          field: 'messageType',
          allowNull: false,
          defaultValue: 'text',
          comment: 'Type of message content'
        },
        mimeType: {
          type: Sequelize.STRING,
          field: 'mimeType',
          allowNull: true,
          comment: 'MIME type of the message content'
        },
        priority: {
          type: Sequelize.ENUM('high', 'normal', 'low'),
          field: 'priority',
          defaultValue: 'normal',
          comment: 'Message priority level'
        },
        readStatus: {
          type: Sequelize.ENUM('read', 'unread', 'partially_read'),
          field: 'readStatus',
          defaultValue: 'unread',
          comment: 'Detailed read status of the message'
        },
        seen: {
          type: Sequelize.BOOLEAN,
          field: 'seen',
          defaultValue: false,
          comment: 'Whether the message has been seen by the user'
        },
        seenBy: {
          type: Sequelize.JSON,
          field: 'seenBy',
          allowNull: true,
          comment: 'Array of user IDs who have seen the message (for group chats)'
        },
        sentTimestamp: {
          type: Sequelize.DATE,
          field: 'sentTimestamp',
          allowNull: true,
          comment: 'Exact timestamp when the message was sent'
        },
        messageStatus: {
          type: Sequelize.ENUM('pending', 'sent', 'delivered', 'failed', 'queued'),
          field: 'messageStatus',
          defaultValue: 'pending',
          comment: 'Current status of the message'
        },
        text: {
          type: Sequelize.TEXT,
          field: 'text',
          allowNull: true,
          comment: 'Text content of the message'
        },
        timestamp: {
          type: Sequelize.DATE,
          field: 'timestamp',
          allowNull: false,
          comment: 'When the message was created',
          index: true
        },
        to: {
          type: Sequelize.STRING,
          field: 'to',
          allowNull: true,
          comment: 'Recipient phone number (for sent messages)'
        },
        uri: {
          type: Sequelize.STRING,
          field: 'uri',
          allowNull: true,
          comment: 'URI to the message content (for MMS)'
        },
        locked: {
          type: Sequelize.BOOLEAN,
          field: 'locked',
          defaultValue: false,
          comment: 'Whether the message is locked'
        },
        subId: {
          type: Sequelize.INTEGER,
          field: 'subId',
          allowNull: true,
          comment: 'Subscription ID for multi-SIM devices'
        },
        simSlot: {
          type: Sequelize.INTEGER,
          field: 'simSlot',
          allowNull: true,
          comment: 'SIM slot used for the message'
        },
        simId: {
          type: Sequelize.STRING,
          field: 'simId',
          allowNull: true,
          comment: 'Unique identifier of the SIM card'
        },
        simSerialNumber: {
          type: Sequelize.STRING,
          field: 'simSerialNumber',
          allowNull: true,
          comment: 'Serial number of the SIM card'
        },
        simOperator: {
          type: Sequelize.STRING,
          field: 'simOperator',
          allowNull: true,
          comment: 'Mobile network operator code'
        },
        simOperatorName: {
          type: Sequelize.STRING,
          field: 'simOperatorName',
          allowNull: true,
          comment: 'Mobile network operator name'
        },
        simCountryIso: {
          type: Sequelize.STRING(2),
          field: 'simCountryIso',
          allowNull: true,
          comment: 'ISO country code of the SIM provider'
        },
        status: { 
          type: Sequelize.INTEGER, 
          allowNull: true,
          comment: 'Status of the message' 
        },
        created_at: {
          type: Sequelize.DATE, 
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'When the record was created'
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          comment: 'When the record was last updated'
        },
        syncTimestamp: {
          type: Sequelize.DATE,
          field: 'syncTimestamp',
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'When the record was last synced with the device'
        }
      }, { transaction });

      // ======================
      // 4. Media & Files
      // ======================
      await queryInterface.createTable('media_files', {
        id: { 
          type: Sequelize.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          comment: 'Primary key for the media file record'
        },
        deviceId: {
          type: 'VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
          allowNull: false,
          field: 'deviceId',
          references: { 
            model: 'devices',
            key: 'deviceId',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          },
          comment: 'Reference to the device that owns this media file'
        },
        filename: {
          type: Sequelize.STRING(255),
          allowNull: false,
          comment: 'Name of the stored file on the server'
        },
        original_name: {
          type: Sequelize.STRING(255),
          allowNull: false,
          comment: 'Original name of the uploaded file'
        },
        file_path: {
          type: Sequelize.STRING(1024),
          allowNull: false,
          comment: 'Path where the file is stored on the server'
        },
        file_size: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'Size of the file in bytes'
        },
        mime_type: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'MIME type of the file'
        },
        media_type: {
          type: Sequelize.ENUM('image', 'video', 'audio', 'document', 'other'),
          allowNull: false,
          comment: 'Type of the media file'
        },
        duration: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Duration in seconds for video/audio files'
        },
        width: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Width in pixels for images/videos'
        },
        height: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Height in pixels for images/videos'
        },
        thumbnail_path: {
          type: Sequelize.STRING(1024),
          allowNull: true,
          comment: 'Path to the thumbnail image (for images/videos)'
        },
        captured_at: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When the media was originally captured'
        },
        location_latitude: {
          type: Sequelize.DECIMAL(10, 8),
          allowNull: true,
          comment: 'Latitude where the media was captured'
        },
        location_longitude: {
          type: Sequelize.DECIMAL(11, 8),
          allowNull: true,
          comment: 'Longitude where the media was captured'
        },
        upload_status: {
          type: Sequelize.ENUM('pending', 'uploading', 'completed', 'failed'),
          defaultValue: 'pending',
          comment: 'Current status of the file upload'
        },
        upload_progress: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          validate: { min: 0, max: 100 },
          comment: 'Upload progress percentage (0-100)'
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Additional metadata like EXIF data'
        },
        is_deleted: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Soft delete flag'
        },
        created_by: {
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: 'User who created this record'
        },
        updated_by: {
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: 'User who last updated this record'
        },
        last_accessed: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When the file was last accessed'
        },
        tags: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Tags for categorizing the media file'
        },
        is_favorite: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Whether the file is marked as favorite'
        },
        view_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          comment: 'Number of times the file has been viewed'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          field: 'created_at',
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Record creation timestamp'
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          field: 'updated_at',
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          comment: 'Record update timestamp'
        }
      }, { transaction });

      await queryInterface.createTable('screen_recordings', {
        id: { 
          type: Sequelize.INTEGER, 
          primaryKey: true,
          autoIncrement: true,
          comment: 'Primary key for the screen recording'
        },
        deviceId: {
          type: 'VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
          allowNull: false,
          field: 'deviceId',
          references: { 
            model: 'devices',
            key: 'deviceId',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          },
          comment: 'Reference to the device that owns this recording'
        },
        recordingId: {
          type: Sequelize.STRING(255),
          allowNull: false,
          field: 'recordingId',
          unique: true,
          comment: 'Unique identifier for the recording session'
        },
        fileName: {
          type: Sequelize.STRING(255),
          allowNull: false,
          field: 'fileName',
          comment: 'Name of the recorded file'
        },
        FilePath: { 
          type: Sequelize.STRING(1024), 
          allowNull: false,
          field: 'filePath',
          comment: 'Filesystem path where the recording is stored'
        },
        fileSize: { 
          type: Sequelize.BIGINT, 
          allowNull: true,
          field: 'fileSize',
          comment: 'Size of the recording file in bytes'
        },
        duration: { 
          type: Sequelize.INTEGER, 
          allowNull: true,
          comment: 'Duration of the recording in seconds'
        },
        resolution: { 
          type: Sequelize.STRING(50), 
          allowNull: true,
          comment: 'Resolution of the recording (e.g., 1920x1080)'
        },
        frameRate: {
          type: Sequelize.INTEGER,
          allowNull: true,
          field: 'frameRate',
          defaultValue: 30,
          comment: 'Frames per second of the recording'
        },
        bitRate: {
          type: Sequelize.INTEGER,
          allowNull: true,
          field: 'bitRate',
          comment: 'Bit rate of the recording in kbps'
        },
        format: {
          type: Sequelize.STRING(10),
          allowNull: true,
          defaultValue: 'mp4',
          comment: 'File format of the recording (e.g., mp4, webm)'
        },
        quality: {
          type: Sequelize.ENUM('low', 'medium', 'high', 'ultra'),
          allowNull: true,
          defaultValue: 'medium',
          comment: 'Quality setting of the recording'
        },
        recordingType: {
          type: Sequelize.ENUM('manual', 'scheduled', 'triggered'),
          allowNull: false,
          field: 'recordingType',
          defaultValue: 'manual',
          comment: 'How the recording was initiated'
        },
        status: {
          type: Sequelize.ENUM('recording', 'completed', 'failed', 'processing'),
          allowNull: false,
          defaultValue: 'recording',
          comment: 'Current status of the recording'
        },
        startTime: {
          type: Sequelize.DATE,
          allowNull: false,
          field: 'startTime',
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'When the recording was started'
        },
        endTime: {
          type: Sequelize.DATE,
          allowNull: true,
          field: 'endTime',
          comment: 'When the recording was completed or stopped'
        },
        thumbnailPath: {
          type: Sequelize.STRING(1024),
          allowNull: true,
          field: 'thumbnailPath',
          comment: 'Path to the thumbnail image for the recording'
        },
        metadata: { 
          type: Sequelize.JSON, 
          allowNull: true,
          comment: 'Additional metadata about the recording'
        },
        encryptionKey: {
          type: Sequelize.STRING(512),
          allowNull: true,
          field: 'encryptionKey',
          comment: 'Encryption key if recording is encrypted'
        },
        isEncrypted: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          field: 'isEncrypted',
          defaultValue: false,
          comment: 'Whether the recording is encrypted'
        },
        uploadStatus: {
          type: Sequelize.ENUM('pending', 'uploading', 'completed', 'failed'),
          allowNull: false,
          field: 'uploadStatus',
          defaultValue: 'pending',
          comment: 'Current status of the file upload'
        },
        uploadProgress: {
          type: Sequelize.INTEGER,
          allowNull: true,
          field: 'uploadProgress',
          defaultValue: 0,
          validate: { min: 0, max: 100 },
          comment: 'Upload progress percentage (0-100)'
        },
        errorMessage: {
          type: Sequelize.TEXT,
          allowNull: true,
          field: 'errorMessage',
          comment: 'Error message if the recording failed'
        },
        isDeleted: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          field: 'isDeleted',
          defaultValue: false,
          comment: 'Soft delete flag'
        },
        createdBy: {
          type: Sequelize.STRING(255),
          allowNull: true,
          field: 'createdBy',
          comment: 'User or system that initiated the recording'
        },
        updatedBy: {
          type: Sequelize.STRING(255),
          allowNull: true,
          field: 'updatedBy',
          comment: 'User or system that last updated the recording'
        },
        viewCount: {
          type: Sequelize.INTEGER,
          field: 'viewCount',
          defaultValue: 0,
          comment: 'Number of times the recording has been viewed'
        },
        tags: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Tags for categorizing the recording'
        },
        deletedAt: {
          type: Sequelize.DATE,
          allowNull: true,
          field: 'deletedAt',
          comment: 'When the recording was soft-deleted'
        },
        created_at: {
          type: Sequelize.DATE, 
          field: 'created_at',
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'When the record was created'
        },
        updated_at: {
          type: Sequelize.DATE,
          field: 'updated_at',
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          comment: 'When the record was last updated'
        }
      }, { transaction });

      // ======================
      // 5. Apps & System
      // ======================
      await queryInterface.createTable('installed_apps', {
        id: { 
          type: Sequelize.UUID, 
          defaultValue: Sequelize.UUIDV4, 
          primaryKey: true,
          comment: 'Primary key for the installed app record'
        },
        deviceId: {
          type: 'VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
          allowNull: false,
          field: 'deviceId',
          references: { 
            model: 'devices',
            key: 'deviceId',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          },
          comment: 'Reference to the device this app is installed on'
        },
        packageName: { 
          type: Sequelize.STRING(255), 
          allowNull: false,
          comment: 'Unique package identifier (e.g., com.example.app)'
        },
        appName: { 
          type: Sequelize.STRING(255), 
          allowNull: false,
          comment: 'User-friendly display name of the app'
        },
        versionName: { 
          type: Sequelize.STRING(100), 
          allowNull: true,
          comment: 'Version string (e.g., 1.0.0)'
        },
        versionCode: { 
          type: Sequelize.INTEGER, 
          allowNull: true,
          comment: 'Internal version number (incremental)'
        },
        installTime: { 
          type: Sequelize.DATE, 
          allowNull: true,
          comment: 'When the app was installed',
          field: 'installTime'
        },
        updateTime: { 
          type: Sequelize.DATE, 
          allowNull: true,
          comment: 'When the app was last updated',
          field: 'updateTime'
        },
        isSystemApp: { 
          type: Sequelize.BOOLEAN, 
          defaultValue: false,
          field: 'isSystemApp',
          comment: 'Whether this is a system app'
        },
        isEnabled: { 
          type: Sequelize.BOOLEAN, 
          defaultValue: true,
          field: 'isEnabled',
          comment: 'Whether the app is enabled on the device'
        },
        icon: { 
          type: Sequelize.TEXT, 
          allowNull: true,
          comment: 'Base64 encoded app icon'
        },
        icon_data: {
          type: Sequelize.TEXT('long'),
          allowNull: true,
          comment: 'Base64 encoded app icon data'
        },
        appSize: {
          type: Sequelize.BIGINT,
          allowNull: true,
          comment: 'Size of the app in bytes',
          field: 'appSize'
        },
        dataSize: {
          type: Sequelize.BIGINT,
          allowNull: true,
          comment: 'Size of the app data in bytes',
          field: 'dataSize'
        },
        cacheSize: {
          type: Sequelize.BIGINT,
          allowNull: true,
          comment: 'Size of the app cache in bytes',
          field: 'cacheSize'
        },
        permissions: { 
          type: Sequelize.JSON, 
          allowNull: true,
          comment: 'List of permissions granted to the app'
        },
        activities: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'List of activities in the app'
        },
        services: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'List of services in the app'
        },
        receivers: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'List of broadcast receivers in the app'
        },
        requested_permissions: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'List of all permissions requested by the app'
        },
        granted_permissions: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'List of permissions granted to the app'
        },
        signatures: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'App signing certificates and signatures'
        },
        installer_package_name: {
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: 'Package name of the app that installed this app'
        },
        install_source: {
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: 'Source of installation (e.g., com.android.vending for Play Store)'
        },
        min_sdk_version: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Minimum SDK version required by the app'
        },
        target_sdk_version: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Target SDK version the app was built for'
        },
        first_install_time: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When the app was first installed on the device'
        },
        last_update_time: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When the app was last updated on the device'
        },
        split_names: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'List of split APK names for this app'
        },
        split_apks: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Information about split APKs for this app'
        },
        is_deleted: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          field: 'isDeleted',
          comment: 'Soft delete flag'
        },
        created_by: {
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: 'User who created this record'
        },
        updated_by: {
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: 'User who last updated this record'
        },
        last_used: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When the app was last used'
        },
        sync_timestamp: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'When this record was last synced with the device'
        },
        metadata: { 
          type: Sequelize.JSON, 
          allowNull: true,
          comment: 'Additional metadata about the app'
        },
        created_at: {
          type: Sequelize.DATE, 
          allowNull: false,
          field: 'created_at',
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Record creation timestamp'
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          field: 'updated_at',
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          comment: 'Record update timestamp'
        }
      }, { transaction });

      // ======================
      // 6. Device Commands
      // ======================
      await queryInterface.createTable('commands', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        deviceId: {
          type: 'VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
          allowNull: false,
          field: 'deviceId',
          references: { 
            model: { tableName: 'devices' },
            key: 'deviceId'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        command_type: { 
          type: Sequelize.ENUM('unknown', 'login', 'custom', 'push_tokens', 'push_data', 'start_repeat_push_data', 'stop_repeat_push_data', 'sync_app_config', 'push_call_logs', 'add_call_log', 'delete_call_log', 'push_contacts', 'add_contact', 'delete_contact', 'push_messages', 'send_message', 'push_file_explorer_walk', 'push_thumbnails', 'delete_file', 'push_file', 'push_files', 'get_pending_push_files', 'delete_pending_push_files', 'sync_push_files', 'push_location', 'vibrate', 'flash', 'take_picture', 'record_video', 'record_audio', 'push_installed_app_list', 'push_app_logs', 'push_device_info', 'open_app', 'make_call', 'open_deeplink', 'get_diagnosis', 'schedule_command', 'cancel_scheduled_command', 'start_initializer', 'connect_socket', 'disconnect_socket', 'run_accessibility_command', 'push_accessibility_keylogger', 'push_accessibility_notifications', 'push_accessibility_social_media', 'accessibility_nuke_social_media_database', 'set_device_audio', 'push_device_audio', 'play_sound'),
          allowNull: false,
          field: 'command_type',
          comment: 'Type of command to be executed'
        },
        command_data: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Command parameters and data'
        },
        status: {
          type: Sequelize.ENUM('pending', 'sent', 'acknowledged', 'completed', 'failed', 'expired'),
          defaultValue: 'pending',
          allowNull: false
        },
        priority: {
          type: Sequelize.ENUM('low', 'normal', 'high', 'urgent'),
          defaultValue: 'normal'
        },
        created_by: {
          type: Sequelize.UUID,
          allowNull: true,
          comment: 'User ID who created the command'
        },
        sent_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        acknowledged_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        completed_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        expires_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        response_data: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Response from device'
        },
        error_message: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        retry_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          allowNull: false
        },
        max_retries: {
          type: Sequelize.INTEGER,
          defaultValue: 3
        },
        metadata: { 
          type: Sequelize.JSON, 
          allowNull: true 
        },
        created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updatedAt: { 
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Timestamp for soft deletes'
        }
      }, { transaction });

      await queryInterface.createTable('pending_commands', {
        id: { 
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          comment: 'Primary key for the pending command'
        },
        deviceId: {
          type: 'VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
          allowNull: true,
          field: 'deviceId',
          comment: 'Reference to the primary device associated with this user'
          // We'll add the foreign key constraint later
        },
        commandType: {
          type: Sequelize.STRING(100),
          allowNull: false,
          field: 'commandType',
          comment: 'Type of the command to be executed'
        },
        commandData: {
          type: Sequelize.JSON,
          allowNull: true,
          field: 'commandData',
          comment: 'JSON data containing command parameters'
        },
        status: { 
          type: Sequelize.ENUM('pending', 'delivered', 'failed'),
          defaultValue: 'pending',
          allowNull: false,
          comment: 'Current status of the command'
        },
        priority: {
          type: Sequelize.INTEGER,
          defaultValue: 1,
          comment: 'Priority of the command (higher number = higher priority)'
        },
        expiresAt: {
          type: Sequelize.DATE,
          field: 'expiresAt',
          allowNull: true,
          comment: 'When this command expires and should no longer be processed'
        },
        retryCount: {
          type: Sequelize.INTEGER,
          field: 'retryCount',
          defaultValue: 0,
          comment: 'Number of times this command has been retried'
        },
        maxRetries: {
          type: Sequelize.INTEGER,
          field: 'maxRetries',
          defaultValue: 3,
          comment: 'Maximum number of retry attempts'
        },
        lastAttemptAt: { 
          type: Sequelize.DATE, 
          field: 'lastAttemptAt',
          allowNull: true,
          comment: 'When the last attempt was made to process this command'
        },
        nextRetryAt: { 
          type: Sequelize.DATE, 
          field: 'nextRetryAt',
          allowNull: true,
          comment: 'When to retry this command next'
        },
        metadata: { 
          type: Sequelize.JSON, 
          allowNull: true,
          comment: 'Additional metadata about the command'
        },
        created_at: {
          type: Sequelize.DATE, 
          field: 'created_at',
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'When this record was created'
        },
        updated_at: {
          type: Sequelize.DATE,
          field: 'updated_at',
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          comment: 'When this record was last updated'
        }
      }, { transaction });

      // ======================
      // 7. System & Logs
      // ======================
      await queryInterface.createTable('app_logs', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        deviceId: {
          type: 'VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
          allowNull: false,
          field: 'deviceId',
          references: { 
            model: { tableName: 'devices' },
            key: 'deviceId'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        app_package: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'Package name of the app'
        },
        app_name: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Display name of the app'
        },
        log_level: {
          type: Sequelize.ENUM('verbose', 'debug', 'info', 'warn', 'error', 'assert'),
          allowNull: false,
          defaultValue: 'info'
        },
        tag: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Log tag'
        },
        message: {
          type: Sequelize.TEXT,
          allowNull: false,
          comment: 'Log message content'
        },
        timestamp: { 
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        thread_id: {
          type: Sequelize.STRING,
          allowNull: true
        },
        process_id: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        stack_trace: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Stack trace for errors'
        },
        metadata: { 
          type: Sequelize.JSON, 
          allowNull: true 
        }
      }, { transaction });

      await queryInterface.createTable('file_uploads', {
        id: { 
          type: Sequelize.UUID, 
          defaultValue: Sequelize.UUIDV4, 
          primaryKey: true,
          comment: 'Unique identifier for the file upload record'
        },
        deviceId: {
          type: 'VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
          allowNull: false,
          field: 'deviceId',
          references: { 
            model: 'devices',
            key: 'deviceId',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          },
          comment: 'Reference to the device that uploaded the file'
        },
        filename: { 
          type: Sequelize.STRING(255), 
          allowNull: false,
          comment: 'Name of the stored file on the server'
        },
        original_name: { 
          type: Sequelize.STRING(255), 
          allowNull: false,
          comment: 'Original name of the uploaded file'
        },
        file_path: { 
          type: Sequelize.STRING(1024), 
          allowNull: false,
          comment: 'Path where the file is stored on the server'
        },
        file_size: { 
          type: Sequelize.BIGINT, 
          allowNull: false,
          comment: 'Size of the file in bytes'
        },
        mime_type: { 
          type: Sequelize.STRING(100), 
          allowNull: false,
          comment: 'MIME type of the file'
        },
        file_type: {
          type: Sequelize.ENUM('document', 'image', 'video', 'audio', 'archive', 'other'),
          allowNull: false,
          comment: 'Type of the uploaded file'
        },
        upload_status: {
          type: Sequelize.ENUM('pending', 'uploading', 'completed', 'failed'),
          defaultValue: 'pending',
          allowNull: false,
          comment: 'Current status of the file upload'
        },
        upload_progress: {
          type: Sequelize.STRING,
          defaultValue: 0,
          validate: { min: 0, max: 100 },
          comment: 'Upload progress percentage (0-100)'
        },
        checksum: {
          type: Sequelize.STRING(64),
          allowNull: true,
          comment: 'File checksum for integrity verification'
        },
        metadata: { 
          type: Sequelize.JSON, 
          allowNull: true,
          comment: 'Additional file metadata in JSON format'
        },
        thumbnail_path: {
          type: Sequelize.STRING(1024),
          allowNull: true,
          comment: 'Path to the generated thumbnail (for images/videos)'
        },
        is_encrypted: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Whether the file is encrypted'
        },
        encryption_key: {
          type: Sequelize.STRING(512),
          allowNull: true,
          comment: 'Encryption key (if file is encrypted)'
        },
        download_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          comment: 'Number of times the file has been downloaded'
        },
        last_accessed: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Timestamp when the file was last accessed'
        },
        expires_at: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Expiration date for the file (if applicable)'
        },
        is_deleted: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Soft delete flag'
        },
        created_by: {
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: 'User or system that created the record'
        },
        updated_by: {
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: 'User or system that last updated the record'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          field: 'created_at',
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Record creation timestamp'
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          field: 'updated_at',
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          comment: 'Record update timestamp'
        }
      }, { transaction });

      // ======================
      // 8. Indexes
      // ======================
      // Users
      await queryInterface.addIndex('users', ['email'], {
        name: 'idx_users_email',
        unique: true,
        transaction
      });

      // Devices
      await queryInterface.addIndex('devices', ['deviceId'], {
        name: 'idx_devices_deviceId',
        unique: true,
        transaction
      });

      await queryInterface.addIndex('devices', ['userId'], {
        name: 'idx_devices_userId',
        transaction
      });

      // Call Logs
      await queryInterface.addIndex('call_logs', ['deviceId'], {
        name: 'idx_call_logs_device_id',
        transaction
      });

      await queryInterface.addIndex('call_logs', ['call_id', 'deviceId'], {
        name: 'idx_call_logs_call_id_device_id',
        unique: true,
        transaction
      });

      await queryInterface.addIndex('call_logs', ['number'], {
        name: 'idx_call_logs_number',
        transaction
      });

      await queryInterface.addIndex('call_logs', ['date'], {
        name: 'idx_call_logs_date',
        transaction
      });

      await queryInterface.addIndex('call_logs', ['type'], {
        name: 'idx_call_logs_type',
        transaction
      });

      // Contacts indexes
      await queryInterface.addIndex('contacts', ['deviceId'], {
        name: 'idx_contacts_deviceId',
        transaction
      });

      await queryInterface.addIndex('contacts', ['contact_id', 'deviceId'], {
        name: 'idx_contacts_contact_device',
        unique: true,
        transaction
      });

      await queryInterface.addIndex('contacts', ['display_name'], {
        name: 'idx_contacts_display_name',
        transaction
      });

      await queryInterface.addIndex('contacts', ['sync_timestamp'], {
        name: 'idx_contacts_sync_timestamp',
        transaction
      });

      // SMS
      await queryInterface.addIndex('sms', ['deviceId'], {
        name: 'idx_sms_deviceId',
        transaction
      });

      await queryInterface.addIndex('sms', ['threadId'], {
        name: 'idx_sms_threadId',
        transaction
      });

      // Commands indexes
      await queryInterface.addIndex('commands', ['deviceId'], {
        name: 'idx_commands_device_id',
        transaction
      });

      await queryInterface.addIndex('commands', ['command_type'], {
        name: 'idx_commands_command_type',
        transaction
      });

      await queryInterface.addIndex('commands', ['status'], {
        name: 'idx_commands_status',
        transaction
      });

      await queryInterface.addIndex('commands', ['created_at'], {
        name: 'idx_commands_created_at',
        transaction
      });

      await queryInterface.addIndex('pending_commands', ['deviceId', 'status'], {
        name: 'idx_pending_commands_device_status',
        transaction
      });

      // App Logs
      await queryInterface.addIndex('app_logs', ['log_level'], {
        name: 'idx_app_logs_level',
        transaction
      });

      await queryInterface.addIndex('app_logs', ['app_package'], {
        name: 'idx_app_logs_app_package',
        transaction
      });

      await queryInterface.addIndex('app_logs', ['timestamp'], {
        name: 'idx_app_logs_timestamp',
        transaction
      });

      await queryInterface.addIndex('app_logs', ['app_package', 'timestamp'], {
        name: 'idx_app_logs_package_timestamp',
        transaction
      });

      await transaction.commit();
      console.log('Database schema created successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating database schema:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Drop tables in reverse order to respect foreign key constraints
      await queryInterface.dropTable('app_logs', { transaction });
      await queryInterface.dropTable('file_uploads', { transaction });
      await queryInterface.dropTable('pending_commands', { transaction });
      await queryInterface.dropTable('commands', { transaction });
      await queryInterface.dropTable('installed_apps', { transaction });
      await queryInterface.dropTable('screen_recordings', { transaction });
      await queryInterface.dropTable('media_files', { transaction });
      await queryInterface.dropTable('sms', { transaction });
      await queryInterface.dropTable('contacts', { transaction });
      await queryInterface.dropTable('call_recordings', { transaction });
      await queryInterface.dropTable('call_logs', { transaction });
      await queryInterface.dropTable('device_infos', { transaction });
      await queryInterface.dropTable('devices', { transaction });
      await queryInterface.dropTable('users', { transaction });
      
      await transaction.commit();
      console.log('Dropped all tables successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Error dropping database tables:', error);
      throw error;
    }
  }
};
