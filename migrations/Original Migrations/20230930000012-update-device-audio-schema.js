'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'device_audio';
    
    try {
      // Check if table exists
      const [tables] = await queryInterface.sequelize.query(
        `SHOW TABLES LIKE '${tableName}'`,
        { transaction }
      );
      
      if (tables.length === 0) {
        // If table doesn't exist, create it with the correct schema
        await queryInterface.createTable(tableName, {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          device_id: {
            type: Sequelize.STRING(255),
            allowNull: false,
            references: {
              model: 'devices',
              key: 'device_id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: 'Reference to devices table (deviceId)'
          },
          ringer_mode: {
            type: Sequelize.ENUM('silent', 'vibrate', 'normal', 'unknown'),
            allowNull: false,
            defaultValue: 'unknown'
          },
          music_volume: {
            type: Sequelize.INTEGER,
            allowNull: true,
            validate: {
              min: 0,
              max: 100
            },
            comment: 'Music/Media volume level (0-100)'
          },
          ring_volume: {
            type: Sequelize.INTEGER,
            allowNull: true,
            validate: {
              min: 0,
              max: 100
            },
            comment: 'Ring volume level (0-100)'
          },
          call_volume: {
            type: Sequelize.INTEGER,
            allowNull: true,
            validate: {
              min: 0,
              max: 100
            },
            comment: 'Call volume level (0-100)'
          },
          alarm_volume: {
            type: Sequelize.INTEGER,
            allowNull: true,
            validate: {
              min: 0,
              max: 100
            },
            comment: 'Alarm volume level (0-100)'
          },
          notification_volume: {
            type: Sequelize.INTEGER,
            allowNull: true,
            validate: {
              min: 0,
              max: 100
            },
            comment: 'Notification volume level (0-100)'
          },
          system_volume: {
            type: Sequelize.INTEGER,
            allowNull: true,
            validate: {
              min: 0,
              max: 100
            },
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
            type: Sequelize.STRING(50),
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
            type: Sequelize.STRING(100),
            allowNull: true,
            comment: 'Current audio focus state'
          },
          recording_file_path: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Path to recorded audio file'
          },
          recording_duration: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Duration of recording in seconds'
          },
          recording_format: {
            type: Sequelize.STRING(10),
            allowNull: true,
            comment: 'Audio recording format (mp3, wav, etc.)'
          },
          recording_quality: {
            type: Sequelize.STRING(50),
            allowNull: true,
            comment: 'Recording quality setting'
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
        
        // Add indexes
        await queryInterface.addIndex(tableName, ['device_id'], {
          name: 'idx_device_audio_device_id',
          transaction
        });
        
        await queryInterface.addIndex(tableName, ['ringer_mode'], {
          name: 'idx_device_audio_ringer_mode',
          transaction
        });
        
        await queryInterface.addIndex(tableName, ['created_at'], {
          name: 'idx_device_audio_created_at',
          transaction
        });
        
        await transaction.commit();
        return;
      }
      
      // Table exists, check and add missing columns
      const columns = await queryInterface.describeTable(tableName, { transaction });
      
      // Add missing columns
      if (!columns.ringer_mode) {
        await queryInterface.addColumn(
          tableName,
          'ringer_mode',
          {
            type: Sequelize.ENUM('silent', 'vibrate', 'normal', 'unknown'),
            allowNull: false,
            defaultValue: 'unknown',
            after: 'device_id'
          },
          { transaction }
        );
      }
      
      if (!columns.music_volume) {
        await queryInterface.addColumn(
          tableName,
          'music_volume',
          {
            type: Sequelize.INTEGER,
            allowNull: true,
            after: 'ringer_mode',
            comment: 'Music/Media volume level (0-100)'
          },
          { transaction }
        );
      }
      
      if (!columns.ring_volume) {
        await queryInterface.addColumn(
          tableName,
          'ring_volume',
          {
            type: Sequelize.INTEGER,
            allowNull: true,
            after: 'music_volume',
            comment: 'Ring volume level (0-100)'
          },
          { transaction }
        );
      }
      
      if (!columns.call_volume) {
        await queryInterface.addColumn(
          tableName,
          'call_volume',
          {
            type: Sequelize.INTEGER,
            allowNull: true,
            after: 'ring_volume',
            comment: 'Call volume level (0-100)'
          },
          { transaction }
        );
      }
      
      if (!columns.alarm_volume) {
        await queryInterface.addColumn(
          tableName,
          'alarm_volume',
          {
            type: Sequelize.INTEGER,
            allowNull: true,
            after: 'call_volume',
            comment: 'Alarm volume level (0-100)'
          },
          { transaction }
        );
      }
      
      if (!columns.notification_volume) {
        await queryInterface.addColumn(
          tableName,
          'notification_volume',
          {
            type: Sequelize.INTEGER,
            allowNull: true,
            after: 'alarm_volume',
            comment: 'Notification volume level (0-100)'
          },
          { transaction }
        );
      }
      
      if (!columns.system_volume) {
        await queryInterface.addColumn(
          tableName,
          'system_volume',
          {
            type: Sequelize.INTEGER,
            allowNull: true,
            after: 'notification_volume',
            comment: 'System volume level (0-100)'
          },
          { transaction }
        );
      }
      
      if (!columns.is_speaker_on) {
        await queryInterface.addColumn(
          tableName,
          'is_speaker_on',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            after: 'system_volume',
            comment: 'Whether speaker is enabled'
          },
          { transaction }
        );
      }
      
      if (!columns.is_microphone_muted) {
        await queryInterface.addColumn(
          tableName,
          'is_microphone_muted',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            after: 'is_speaker_on',
            comment: 'Whether microphone is muted'
          },
          { transaction }
        );
      }
      
      if (!columns.audio_mode) {
        await queryInterface.addColumn(
          tableName,
          'audio_mode',
          {
            type: Sequelize.STRING(50),
            allowNull: true,
            after: 'is_microphone_muted',
            comment: 'Current audio mode (normal, in_call, in_communication, ringtone)'
          },
          { transaction }
        );
      }
      
      if (!columns.bluetooth_audio_connected) {
        await queryInterface.addColumn(
          tableName,
          'bluetooth_audio_connected',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            after: 'audio_mode',
            comment: 'Whether Bluetooth audio device is connected'
          },
          { transaction }
        );
      }
      
      if (!columns.wired_headset_connected) {
        await queryInterface.addColumn(
          tableName,
          'wired_headset_connected',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            after: 'bluetooth_audio_connected',
            comment: 'Whether wired headset is connected'
          },
          { transaction }
        );
      }
      
      if (!columns.audio_focus_state) {
        await queryInterface.addColumn(
          tableName,
          'audio_focus_state',
          {
            type: Sequelize.STRING(100),
            allowNull: true,
            after: 'wired_headset_connected',
            comment: 'Current audio focus state'
          },
          { transaction }
        );
      }
      
      // Rename columns if they exist with old names
      if (columns.file_path && !columns.recording_file_path) {
        await queryInterface.renameColumn(
          tableName,
          'file_path',
          'recording_file_path',
          { transaction }
        );
      }
      
      if (columns.duration && !columns.recording_duration) {
        await queryInterface.renameColumn(
          tableName,
          'duration',
          'recording_duration',
          { transaction }
        );
      }
      
      if (columns.mime_type && !columns.recording_format) {
        await queryInterface.renameColumn(
          tableName,
          'mime_type',
          'recording_format',
          { transaction }
        );
      }
      
      // Add recording_quality if it doesn't exist
      if (!columns.recording_quality) {
        await queryInterface.addColumn(
          tableName,
          'recording_quality',
          {
            type: Sequelize.STRING(50),
            allowNull: true,
            after: 'recording_format',
            comment: 'Recording quality setting'
          },
          { transaction }
        );
      }
      
      // Change id from INTEGER to UUID if needed
      if (columns.id && columns.id.type === 'int unsigned') {
        // Create a temporary table with the new schema
        await queryInterface.createTable('device_audio_new', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          device_id: {
            type: Sequelize.STRING(255),
            allowNull: false,
            references: {
              model: 'devices',
              key: 'device_id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          ringer_mode: {
            type: Sequelize.ENUM('silent', 'vibrate', 'normal', 'unknown'),
            allowNull: false,
            defaultValue: 'unknown'
          },
          music_volume: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Music/Media volume level (0-100)'
          },
          ring_volume: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Ring volume level (0-100)'
          },
          call_volume: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Call volume level (0-100)'
          },
          alarm_volume: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Alarm volume level (0-100)'
          },
          notification_volume: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Notification volume level (0-100)'
          },
          system_volume: {
            type: Sequelize.INTEGER,
            allowNull: true,
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
            type: Sequelize.STRING(50),
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
            type: Sequelize.STRING(100),
            allowNull: true,
            comment: 'Current audio focus state'
          },
          recording_file_path: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Path to recorded audio file'
          },
          recording_duration: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Duration of recording in seconds'
          },
          recording_format: {
            type: Sequelize.STRING(10),
            allowNull: true,
            comment: 'Audio recording format (mp3, wav, etc.)'
          },
          recording_quality: {
            type: Sequelize.STRING(50),
            allowNull: true,
            comment: 'Recording quality setting'
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
        
        // Copy data from old table to new table
        await queryInterface.sequelize.query(
          `INSERT INTO device_audio_new 
           (id, device_id, ringer_mode, music_volume, ring_volume, call_volume, 
            alarm_volume, notification_volume, system_volume, is_speaker_on, 
            is_microphone_muted, audio_mode, bluetooth_audio_connected, 
            wired_headset_connected, audio_focus_state, recording_file_path, 
            recording_duration, recording_format, recording_quality, created_at, updated_at)
           SELECT 
             UUID() as id, 
             device_id, 
             'unknown' as ringer_mode,
             NULL as music_volume,
             NULL as ring_volume,
             NULL as call_volume,
             NULL as alarm_volume,
             NULL as notification_volume,
             NULL as system_volume,
             false as is_speaker_on,
             false as is_microphone_muted,
             NULL as audio_mode,
             false as bluetooth_audio_connected,
             false as wired_headset_connected,
             NULL as audio_focus_state,
             file_path as recording_file_path,
             duration as recording_duration,
             mime_type as recording_format,
             NULL as recording_quality,
             COALESCE(created_at, NOW()) as created_at,
             COALESCE(updated_at, NOW()) as updated_at
           FROM device_audio`,
          { transaction }
        );
        
        // Drop old table and rename new one
        await queryInterface.dropTable('device_audio', { transaction });
        await queryInterface.renameTable('device_audio_new', 'device_audio', { transaction });
      }
      
      // Add any missing indexes
      const indexes = await queryInterface.showIndex(tableName, { transaction });
      
      if (!indexes.some(idx => idx.name === 'idx_device_audio_ringer_mode')) {
        await queryInterface.addIndex(
          tableName, 
          ['ringer_mode'],
          {
            name: 'idx_device_audio_ringer_mode',
            transaction
          }
        );
      }
      
      if (!indexes.some(idx => idx.name === 'idx_device_audio_created_at')) {
        await queryInterface.addIndex(
          tableName, 
          ['created_at'],
          {
            name: 'idx_device_audio_created_at',
            transaction
          }
        );
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error in device_audio migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Note: This is a complex migration and cannot be fully rolled back automatically
    // due to the data transformation and potential data loss
    
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'device_audio';
    
    try {
      // Remove added columns if they exist
      const columns = await queryInterface.describeTable(tableName, { transaction });
      
      if (columns.ringer_mode) {
        await queryInterface.removeColumn(tableName, 'ringer_mode', { transaction });
      }
      
      if (columns.music_volume) {
        await queryInterface.removeColumn(tableName, 'music_volume', { transaction });
      }
      
      if (columns.ring_volume) {
        await queryInterface.removeColumn(tableName, 'ring_volume', { transaction });
      }
      
      if (columns.call_volume) {
        await queryInterface.removeColumn(tableName, 'call_volume', { transaction });
      }
      
      if (columns.alarm_volume) {
        await queryInterface.removeColumn(tableName, 'alarm_volume', { transaction });
      }
      
      if (columns.notification_volume) {
        await queryInterface.removeColumn(tableName, 'notification_volume', { transaction });
      }
      
      if (columns.system_volume) {
        await queryInterface.removeColumn(tableName, 'system_volume', { transaction });
      }
      
      if (columns.is_speaker_on) {
        await queryInterface.removeColumn(tableName, 'is_speaker_on', { transaction });
      }
      
      if (columns.is_microphone_muted) {
        await queryInterface.removeColumn(tableName, 'is_microphone_muted', { transaction });
      }
      
      if (columns.audio_mode) {
        await queryInterface.removeColumn(tableName, 'audio_mode', { transaction });
      }
      
      if (columns.bluetooth_audio_connected) {
        await queryInterface.removeColumn(tableName, 'bluetooth_audio_connected', { transaction });
      }
      
      if (columns.wired_headset_connected) {
        await queryInterface.removeColumn(tableName, 'wired_headset_connected', { transaction });
      }
      
      if (columns.audio_focus_state) {
        await queryInterface.removeColumn(tableName, 'audio_focus_state', { transaction });
      }
      
      // Rename columns back if they were renamed
      if (columns.recording_file_path && !columns.file_path) {
        await queryInterface.renameColumn(
          tableName,
          'recording_file_path',
          'file_path',
          { transaction }
        );
      }
      
      if (columns.recording_duration && !columns.duration) {
        await queryInterface.renameColumn(
          tableName,
          'recording_duration',
          'duration',
          { transaction }
        );
      }
      
      if (columns.recording_format && !columns.mime_type) {
        await queryInterface.renameColumn(
          tableName,
          'recording_format',
          'mime_type',
          { transaction }
        );
      }
      
      if (columns.recording_quality) {
        await queryInterface.removeColumn(tableName, 'recording_quality', { transaction });
      }
      
      // Remove added indexes
      const indexes = await queryInterface.showIndex(tableName, { transaction });
      
      if (indexes.some(idx => idx.name === 'idx_device_audio_ringer_mode')) {
        await queryInterface.removeIndex(tableName, 'idx_device_audio_ringer_mode', { transaction });
      }
      
      if (indexes.some(idx => idx.name === 'idx_device_audio_created_at')) {
        await queryInterface.removeIndex(tableName, 'idx_device_audio_created_at', { transaction });
      }
      
      // Note: We cannot automatically revert the id type change from UUID to INTEGER
      // as it would require data migration and potential data loss
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error rolling back device_audio migration:', error);
      throw error;
    }
  }
};
