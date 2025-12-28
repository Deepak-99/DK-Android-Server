'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. First, create a backup of the call_recordings table
      console.log('Creating backup of call_recordings table...');
      await queryInterface.sequelize.query(
        `CREATE TABLE IF NOT EXISTS call_recordings_backup_20241029 LIKE call_recordings`,
        { transaction }
      );
      
      await queryInterface.sequelize.query(
        `INSERT INTO call_recordings_backup_20241029 SELECT * FROM call_recordings`,
        { transaction }
      );
      
      // 2. Drop the existing call_recordings table
      console.log('Dropping call_recordings table...');
      await queryInterface.dropTable('call_recordings', { transaction });
      
      // 3. Recreate the call_recordings table with the correct schema
      console.log('Recreating call_recordings table with correct schema...');
      await queryInterface.createTable('call_recordings', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          comment: 'Primary key',
        },
        device_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          comment: 'Reference to devices table (id)',
          references: {
            model: 'devices',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        call_log_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
          comment: 'Reference to call_logs table',
          references: {
            model: 'call_logs',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        // Include all other columns from the original table
        phone_number: {
          type: Sequelize.STRING(255),
          comment: 'Phone number of the other party',
        },
        contact_name: {
          type: Sequelize.STRING(255),
          comment: 'Contact name if available',
        },
        start_time: {
          type: Sequelize.DATE,
          allowNull: false,
          comment: 'When the call started',
        },
        end_time: {
          type: Sequelize.DATE,
          comment: 'When the call ended',
        },
        duration: {
          type: Sequelize.INTEGER,
          comment: 'Call duration in seconds',
        },
        recording_file_path: {
          type: Sequelize.TEXT,
          comment: 'Path to the recording file',
        },
        recording_file_size: {
          type: Sequelize.BIGINT,
          comment: 'Size of recording file in bytes',
        },
        recording_duration: {
          type: Sequelize.INTEGER,
          comment: 'Duration of recording in seconds',
        },
        recording_format: {
          type: Sequelize.STRING(255),
          allowNull: false,
          comment: 'Audio format (mp3, wav, m4a, etc.)',
        },
        recording_quality: {
          type: Sequelize.ENUM('low', 'medium', 'high'),
          allowNull: false,
          comment: 'Recording quality',
        },
        recording_source: {
          type: Sequelize.ENUM('microphone', 'voice_call', 'voice_communication', 'voice_recognition'),
          comment: 'Audio source used for recording',
        },
        transcription: {
          type: Sequelize.TEXT,
          comment: 'Text transcription of the call (if available)',
        },
        metadata: {
          type: Sequelize.JSON,
          comment: 'Additional metadata about the call and recording',
        },
        is_deleted: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Soft delete flag',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        },
        transcription_confidence: {
          type: Sequelize.FLOAT,
          comment: 'Confidence score of transcription (0-1)',
        },
        call_direction: {
          type: Sequelize.ENUM('inbound', 'outbound'),
          allowNull: false,
          comment: 'Direction of the call',
        },
        sim_slot: {
          type: Sequelize.INTEGER,
          comment: 'SIM slot used for the call (0, 1, etc.)',
        },
        network_type: {
          type: Sequelize.STRING(255),
          comment: 'Network type during call (2G, 3G, 4G, 5G, WiFi)',
        },
        call_state_changes: {
          type: Sequelize.JSON,
          comment: 'Array of call state changes with timestamps',
        },
        upload_timestamp: {
          type: Sequelize.DATE,
          comment: 'When the recording was uploaded to server',
        },
        is_processed: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Whether the recording has been processed/analyzed',
        },
        processing_status: {
          type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'),
          defaultValue: 'pending',
          comment: 'Status of recording processing',
        },
        tags: {
          type: Sequelize.JSON,
          comment: 'Tags for categorizing recordings',
        },
        notes: {
          type: Sequelize.TEXT,
          comment: 'Admin notes about the recording',
        },
        is_important: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Whether this recording is marked as important',
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
      }, {
        transaction,
        comment: 'Stores call recordings with metadata',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      });

      // 4. Create indexes for better performance
      console.log('Creating indexes...');
      await queryInterface.addIndex('call_recordings', ['device_id'], {
        name: 'idx_call_recordings_device_id',
        transaction,
      });
      
      await queryInterface.addIndex('call_recordings', ['call_direction'], {
        name: 'idx_call_recordings_direction',
        transaction,
      });
      
      await queryInterface.addIndex('call_recordings', ['start_time'], {
        name: 'idx_call_recordings_start_time',
        transaction,
      });
      
      await queryInterface.addIndex('call_recordings', ['is_important'], {
        name: 'idx_call_recordings_is_important',
        transaction,
      });
      
      await queryInterface.addIndex('call_recordings', ['processing_status'], {
        name: 'idx_call_recordings_processing_status',
        transaction,
      });
      
      await queryInterface.addIndex('call_recordings', ['upload_timestamp'], {
        name: 'idx_call_recordings_upload_timestamp',
        transaction,
      });
      
      // 5. Copy data back from backup
      console.log('Copying data from backup...');
      await queryInterface.sequelize.query(
        `INSERT INTO call_recordings 
         SELECT * FROM call_recordings_backup_20241029`,
        { transaction }
      );
      
      // 6. Drop the backup table
      console.log('Cleaning up...');
      await queryInterface.dropTable('call_recordings_backup_20241029', { transaction });
      
      await transaction.commit();
      console.log('Successfully fixed call_recordings table with correct schema and constraints');
    } catch (error) {
      await transaction.rollback();
      console.error('Error in migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // No down migration as this is a fix
    return Promise.resolve();
  }
};
