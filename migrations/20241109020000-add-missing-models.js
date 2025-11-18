'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // ======================
      // 1. App Updates
      // ======================
      await queryInterface.createTable('app_updates', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        versionName: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'Version name (e.g., 1.0.0)'
        },
        versionCode: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Version code (incremental number)'
        },
        isCritical: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        },
        minSdkVersion: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        targetSdkVersion: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        filePath: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Path to the APK file'
        },
        fileSize: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'File size in bytes'
        },
        checksum: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'File checksum for verification'
        },
        releaseNotes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        isEnabled: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false
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
      }, { transaction });

      // ======================
      // 2. App Installations
      // ======================
      await queryInterface.createTable('app_installations', {
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
          onDelete: 'CASCADE'
        },
        packageName: {
          type: Sequelize.STRING,
          allowNull: false
        },
        versionName: {
          type: Sequelize.STRING,
          allowNull: false
        },
        versionCode: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        firstInstallTime: {
          type: Sequelize.DATE,
          allowNull: true
        },
        lastUpdateTime: {
          type: Sequelize.DATE,
          allowNull: true
        },
        isSystemApp: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        isEnabled: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        appUpdateId: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { 
            model: 'app_updates', 
            key: 'id',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
          }
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true
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
      }, { transaction });

      // ======================
      // 4. Accessibility Data
      // ======================
      await queryInterface.createTable('accessibility_data', {
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
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          comment: 'Reference to devices table (deviceId)'
        },
        data_type: {
          type: Sequelize.ENUM('keylogger', 'notifications', 'social_media', 'screen_content', 'ui_events'),
          allowNull: false,
          field: 'data_type'
        },
        app_package: {
          type: Sequelize.STRING,
          field: 'app_package',
          allowNull: true,
          comment: 'Package name of the source app'
        },
        app_name: {
          type: Sequelize.STRING,
          field: 'app_name',
          allowNull: true,
          comment: 'Display name of the source app'
        },
        event_type: {
          type: Sequelize.STRING,
          field: 'event_type',
          allowNull: true,
          comment: 'Type of accessibility event'
        },
        content_text: {
          type: Sequelize.TEXT,
          field: 'content_text',
          allowNull: true,
          comment: 'Text content captured'
        },
        content_description: {
          type: Sequelize.TEXT,
          field: 'content_description',
          allowNull: true,
          comment: 'Content description'
        },
        class_name: {
          type: Sequelize.STRING,
          field: 'class_name',
          allowNull: true,
          comment: 'UI element class name'
        },
        view_id: {
          type: Sequelize.STRING,
          field: 'view_id',
          allowNull: true,
          comment: 'View resource ID'
        },
        window_title: {
          type: Sequelize.STRING,
          field: 'window_title',
          allowNull: true,
          comment: 'Window or activity title'
        },
        notification_title: {
          type: Sequelize.STRING,
          field: 'notification_title',
          allowNull: true,
          comment: 'Notification title (for notification events)'
        },
        notification_text: {
          type: Sequelize.TEXT,
          field: 'notification_text',
          allowNull: true,
          comment: 'Notification content text'
        },
        notification_key: {
          type: Sequelize.STRING,
          field: 'notification_key',
          allowNull: true,
          comment: 'Notification key'
        },
        keystrokes: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Captured keystrokes (for keylogger)'
        },
        coordinates: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'UI element coordinates {x, y, width, height}'
        },
        screenshot_path: {
          type: Sequelize.STRING,
          field: 'screenshot_path',
          allowNull: true,
          comment: 'Path to associated screenshot'
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Additional event metadata'
        },
        timestamp: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        is_sensitive: {
          type: Sequelize.BOOLEAN,
          field: 'is_sensitive',
          defaultValue: false,
          comment: 'Whether this data contains sensitive information'
        },
        is_deleted: {
          type: Sequelize.BOOLEAN,
          field: 'is_deleted',
          defaultValue: false
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
        collate: 'utf8mb4_unicode_ci'
      });

      // Add indexes after table creation to avoid issues with foreign keys
      await queryInterface.addIndex('accessibility_data', ['deviceId'], {
        name: 'idx_accessibility_data_deviceId',
        transaction
      });

      await queryInterface.addIndex('accessibility_data', ['data_type'], {
        name: 'idx_accessibility_data_type',
        transaction
      });

      await queryInterface.addIndex('accessibility_data', ['created_at'], {
        name: 'idx_accessibility_created_at',
        transaction
      });

      await queryInterface.addIndex('accessibility_data', ['deviceId', 'timestamp'], {
        name: 'idx_accessibility_device_time',
        transaction
      });

      // ======================
      // 5. File Explorer
      // ======================
      await queryInterface.createTable('file_explorer', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          comment: 'Unique identifier for the file/directory entry'
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
          comment: 'Reference to the device this file belongs to'
        },
        file_path: {
          type: Sequelize.STRING(1024),
          allowNull: false,
          comment: 'Full path to the file or directory'
        },
        file_name: {
          type: Sequelize.STRING(255),
          allowNull: false,
          comment: 'Name of the file or directory'
        },
        parent_path: {
          type: Sequelize.STRING(1024),
          allowNull: true,
          comment: 'Parent directory path'
        },
        file_type: {
          type: Sequelize.ENUM('file', 'directory', 'symlink', 'unknown'),
          allowNull: false,
          comment: 'Type of the file system entry'
        },
        file_size: {
          type: Sequelize.BIGINT,
          allowNull: true,
          comment: 'File size in bytes (null for directories)'
        },
        mime_type: {
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: 'MIME type for files'
        },
        last_modified: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Last modification time'
        },
        permissions: {
          type: Sequelize.STRING(10),
          allowNull: true,
          comment: 'File permissions (e.g., rwxrwxrwx)'
        },
        owner: {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: 'File owner'
        },
        group: {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: 'File group'
        },
        is_hidden: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Whether the file is hidden'
        },
        is_readable: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          comment: 'Whether the file is readable'
        },
        is_writable: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Whether the file is writable'
        },
        is_executable: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Whether the file is executable'
        },
        thumbnail_path: {
          type: Sequelize.STRING(1024),
          allowNull: true,
          comment: 'Path to thumbnail image'
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Additional file metadata'
        },
        scan_timestamp: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'When this file was scanned'
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          comment: 'Whether this file entry is active'
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
      }, { transaction,
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci' });

      // ======================
      // 6. Device Audio
      // ======================
      await queryInterface.createTable('device_audio', {
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
            key: 'deviceId',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          },
          comment: 'Reference to the device this audio belongs to'
        },
        ringer_mode: {
          type: Sequelize.ENUM('silent', 'vibrate', 'normal', 'unknown'),
          allowNull: false,
          defaultValue: 'unknown',
          comment: 'Current ringer mode of the device'
        },
        music_volume: {
          type: Sequelize.INTEGER,
          allowNull: true,
          validate: { min: 0, max: 100 },
          comment: 'Music/Media volume level (0-100)'
        },
        ring_volume: {
          type: Sequelize.INTEGER,
          allowNull: true,
          validate: { min: 0, max: 100 },
          comment: 'Ring volume level (0-100)'
        },
        call_volume: {
          type: Sequelize.INTEGER,
          allowNull: true,
          validate: { min: 0, max: 100 },
          comment: 'Call volume level (0-100)'
        },
        alarm_volume: {
          type: Sequelize.INTEGER,
          allowNull: true,
          validate: { min: 0, max: 100 },
          comment: 'Alarm volume level (0-100)'
        },
        notification_volume: {
          type: Sequelize.INTEGER,
          allowNull: true,
          validate: { min: 0, max: 100 },
          comment: 'Notification volume level (0-100)'
        },
        system_volume: {
          type: Sequelize.INTEGER,
          allowNull: true,
          validate: { min: 0, max: 100 },
          comment: 'System volume level (0-100)'
        },
        is_speaker_on: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Whether speaker is enabled'
        },
        is_microphone_muted: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Whether microphone is muted'
        },
        audio_mode: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Current audio mode (normal, in_call, in_communication, ringtone)'
        },
        bluetooth_audio_connected: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Whether Bluetooth audio device is connected'
        },
        wired_headset_connected: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Whether wired headset is connected'
        },
        audio_focus_state: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Current audio focus state'
        },
        recording_file_path: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Path to recorded audio file'
        },
        recording_duration: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Duration of recording in seconds'
        },
        recording_format: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Audio recording format (mp3, wav, etc.)'
        },
        recording_quality: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Recording quality setting'
        },
        timestamp: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Timestamp of the audio state'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Record creation timestamp'
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          comment: 'Record update timestamp'
        }
      }, { transaction });

      // ======================
      // 7. Dynamic Configs
      // ======================
      await queryInterface.createTable('dynamic_config', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        deviceId: {
          type: 'VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
          allowNull: true,
          field: 'deviceId',
          references: { 
            model: 'devices',
            key: 'deviceId',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          },
          comment: 'Null for global config, specific device ID for device-specific config'
        },
        config_key: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'Configuration key identifier'
        },
        config_value: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Configuration value (can be JSON string)'
        },
        config_type: {
          type: Sequelize.ENUM('string', 'number', 'boolean', 'json', 'array'),
          allowNull: false,
          defaultValue: 'string',
          comment: 'Type of the configuration value'
        },
        category: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Configuration category (e.g., app_settings, security, features)'
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Description of what this config does'
        },
        is_sensitive: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Whether this config contains sensitive data'
        },
        is_readonly: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Whether this config can be modified'
        },
        default_value: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Default value for this configuration'
        },
        validation_rules: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Validation rules for the config value'
        },
        created_by: {
          type: Sequelize.UUID,
          allowNull: true,
          comment: 'User who created this config'
        },
        updated_by: {
          type: Sequelize.UUID,
          allowNull: true,
          comment: 'User who last updated this config'
        },
        version: {
          type: Sequelize.INTEGER,
          defaultValue: 1,
          comment: 'Configuration version for tracking changes'
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          comment: 'Whether this config is currently active'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          field: 'created_at',
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          field: 'updated_at',
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // ======================
      // 8. Device Locations
      // ======================
      await queryInterface.createTable('device_locations', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          comment: 'Unique identifier for the location record'
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
          comment: 'Reference to the device that reported this location'
        },
        latitude: {
          type: Sequelize.DECIMAL(10, 8),
          allowNull: false,
          comment: 'Latitude coordinate'
        },
        longitude: {
          type: Sequelize.DECIMAL(11, 8),
          allowNull: false,
          comment: 'Longitude coordinate'
        },
        altitude: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true,
          comment: 'Altitude in meters'
        },
        accuracy: {
          type: Sequelize.FLOAT,
          allowNull: true,
          comment: 'Location accuracy in meters'
        },
        speed: {
          type: Sequelize.FLOAT,
          allowNull: true,
          comment: 'Speed in meters/second'
        },
        bearing: {
          type: Sequelize.FLOAT,
          allowNull: true,
          comment: 'Bearing in degrees'
        },
        provider: {
          type: Sequelize.STRING(50),
          allowNull: true,
          comment: 'Location provider (GPS, network, etc.)'
        },
        address: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Reverse geocoded address'
        },
        timestamp: {
          type: Sequelize.DATE,
          allowNull: false,
          comment: 'When the location was recorded',
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        battery_level: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Battery level when location was recorded'
        },
        network_type: {
          type: Sequelize.STRING(50),
          allowNull: true,
          comment: 'Type of network connection when location was recorded'
        },
        is_mock: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Whether this is a mock location'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          field: 'created_at',
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          field: 'updated_at',
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        },
        is_deleted: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Soft delete flag'
        }
      }, { transaction });

      // Add indexes for better query performance
      await queryInterface.addIndex('device_locations', ['deviceId'], {
        name: 'idx_device_locations_device_id',
        transaction
      });

      await queryInterface.addIndex('device_locations', ['timestamp'], {
        name: 'idx_device_locations_timestamp',
        transaction
      });

      await queryInterface.addIndex('device_locations', ['latitude', 'longitude'], {
        name: 'idx_device_locations_coordinates',
        transaction
      });

      await queryInterface.addIndex('device_locations', ['provider'], {
        name: 'idx_device_locations_provider',
        transaction
      });

      // ======================
      // 9. Screen Projections
      // ======================
      await queryInterface.createTable('screen_projections', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          comment: 'Unique identifier for the screen projection session'
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
          comment: 'Reference to the device being projected'
        },
        session_id: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true,
          comment: 'Unique session identifier'
        },
        projection_type: {
          type: Sequelize.ENUM('live_stream', 'remote_control', 'view_only'),
          allowNull: false,
          defaultValue: 'view_only',
          comment: 'Type of screen projection session'
        },
        status: {
          type: Sequelize.ENUM('starting', 'active', 'paused', 'stopped', 'error'),
          allowNull: false,
          defaultValue: 'starting',
          comment: 'Current status of the projection'
        },
        resolution: {
          type: Sequelize.STRING(20),
          allowNull: true,
          comment: 'Display resolution (e.g., 1920x1080)'
        },
        frame_rate: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 15,
          comment: 'Frames per second'
        },
        bitrate: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Bitrate in kbps'
        },
        quality: {
          type: Sequelize.ENUM('low', 'medium', 'high'),
          allowNull: false,
          defaultValue: 'medium',
          comment: 'Stream quality setting'
        },
        start_time: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When the projection session started'
        },
        end_time: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When the projection session ended'
        },
        last_activity: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Last activity timestamp'
        },
        client_ip: {
          type: Sequelize.STRING(45),
          allowNull: true,
          comment: 'IP address of the client viewing the projection'
        },
        user_agent: {
          type: Sequelize.STRING(500),
          allowNull: true,
          comment: 'User agent of the client browser'
        },
        frames_transmitted: {
          type: Sequelize.BIGINT,
          defaultValue: 0,
          comment: 'Total frames transmitted'
        },
        bytes_transmitted: {
          type: Sequelize.BIGINT,
          defaultValue: 0,
          comment: 'Total bytes transmitted'
        },
        last_frame_time: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Timestamp of the last frame sent'
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Additional metadata in JSON format'
        },
        error: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Error details if the projection failed'
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          comment: 'Whether the projection is currently active'
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

      // Create device_info table if it doesn't exist
      await queryInterface.createTable('device_info', {
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
            model: 'devices',
            key: 'deviceId',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          },
          comment: 'Reference to devices table (deviceId)'
        },
        hardware_info: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Hardware specifications',
          field: 'hardware_info'
        },
        software_info: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Software and OS information',
          field: 'software_info'
        },
        network_info: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Network configuration and status',
          field: 'network_info'
        },
        security_info: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Security settings and status',
          field: 'security_info'
        },
        installed_apps: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'List of installed applications',
          field: 'installed_apps'
        },
        system_settings: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'System settings and configurations',
          field: 'system_settings'
        },
        permissions: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'App permissions status',
          defaultValue: {}
        },
        battery_level: {
          type: Sequelize.INTEGER,
          allowNull: true,
          validate: {
            min: 0,
            max: 100
          },
          comment: 'Battery level percentage',
          field: 'battery_level'
        },
        storage_info: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Storage information including total and free space',
          field: 'storage_info'
        },
        display_info: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Display information (resolution, density, etc.)',
          field: 'display_info'
        },
        sensors: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Available sensors information'
        },
        lastupdated: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          field: 'last_updated',
          comment: 'Timestamp of the last update'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          field: 'created_at',
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          field: 'updated_at',
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Timestamp for soft deletes'
        }
      }, { 
        transaction,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      });

      // ======================
      // 9. Add Indexes
      // ======================
      
      // App Updates
      await queryInterface.addIndex('app_updates', ['versionCode'], {
        name: 'idx_app_updates_version_code',
        unique: true,
        transaction
      });

      // App Installations
      await queryInterface.addIndex('app_installations', 
        ['deviceId', 'packageName'], 
        { name: 'idx_app_installations_device_package', transaction }
      );

      // File Explorer - Using raw SQL to specify key length for TEXT column
      await queryInterface.sequelize.query(
        'CREATE INDEX `idx_file_explorer_device_path` ON `file_explorer` (`deviceId`, `file_path`(255))',
        { transaction }
      );

      // Device Audio indexes
      await queryInterface.addIndex('device_audio', ['deviceId'], {
        name: 'idx_device_audio_device_id',
        transaction
      });

      await queryInterface.addIndex('device_audio', ['ringer_mode'], {
        name: 'idx_device_audio_ringer_mode',
        transaction
      });

      await queryInterface.addIndex('device_audio', ['created_at'], {
        name: 'idx_device_audio_created_at',
        transaction
      });
      
      await queryInterface.addIndex('device_audio', ['timestamp'], {
        name: 'idx_device_audio_timestamp',
        transaction
      });

      // Screen Projections
      await queryInterface.addIndex('screen_projections', 
        ['deviceId', 'status'], 
        { name: 'idx_screen_projections_device_status', transaction }
      );

      await transaction.commit();
      console.log('Successfully added missing models to the database');
    } catch (error) {
      await transaction.rollback();
      console.error('Error adding missing models:', error);
      throw error;
    }
  },
  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Drop tables in reverse order of creation
      await queryInterface.dropTable('screen_projections', { transaction });
      
      // Remove dynamic_configs index if it exists
      try {
        await queryInterface.removeIndex('dynamic_configs', 'idx_dynamic_configs_device_key', { transaction });
      } catch (error) {
        console.log('Index idx_dynamic_configs_device_key does not exist, skipping drop');
      }
      
      // Remove file_explorer index if it exists
      try {
        await queryInterface.sequelize.query(
          'DROP INDEX `idx_file_explorer_device_path` ON `file_explorer`',
          { transaction }
        );
      } catch (error) {
        console.log('Index idx_file_explorer_device_path does not exist, skipping drop');
      }
      
      // Drop tables
      await queryInterface.dropTable('dynamic_config', { transaction });
      await queryInterface.dropTable('device_audio', { transaction });
      await queryInterface.dropTable('file_explorer', { transaction });
      await queryInterface.dropTable('accessibility_data', { transaction });
      await queryInterface.dropTable('app_installations', { transaction });
      await queryInterface.dropTable('app_updates', { transaction });
      
      await transaction.commit();
      console.log('Successfully rolled back missing models migration');
    } catch (error) {
      await transaction.rollback();
      console.error('Error in down migration:', error);
      throw error;
    }
  }
};
