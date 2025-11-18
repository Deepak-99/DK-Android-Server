const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const CallRecording = sequelize.define('CallRecording', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        deviceId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'devices',
                key: 'deviceId',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE'
            },
            field: 'deviceId',
            comment: 'Reference to devices table (deviceId)',
            // Add index for better query performance
            indexes: [{
                name: 'idx_call_recordings_device_id',
                fields: ['deviceId']
            }]
        },
        call_log_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'call_logs',
                key: 'id'
          },
          comment: 'Reference to associated call log entry'
      },
      phone_number: {
          type: DataTypes.STRING,
          allowNull: false,
          comment: 'Phone number of the call'
      },
      contact_name: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Contact name if available'
      },
      call_type: {
          type: DataTypes.ENUM('incoming', 'outgoing', 'missed', 'rejected', 'blocked'),
          allowNull: false,
          comment: 'Type of call'
      },
      call_start_time: {
          type: DataTypes.DATE,
          allowNull: false,
          comment: 'When the call started'
      },
      call_end_time: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'When the call ended'
      },
      call_duration: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: 'Call duration in seconds'
      },
      recording_file_path: {
          type: DataTypes.STRING,
          allowNull: false,
          comment: 'Path to the recorded call file on server'
      },
      recording_file_name: {
          type: DataTypes.STRING,
          allowNull: false,
          comment: 'Original filename of the recording'
      },
      recording_file_size: {
          type: DataTypes.BIGINT,
          allowNull: true,
          comment: 'Size of recording file in bytes'
      },
      recording_duration: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: 'Duration of recording in seconds'
      },
      recording_format: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: 'mp3',
          comment: 'Audio format (mp3, wav, m4a, etc.)'
      },
      recording_quality: {
          type: DataTypes.ENUM('low', 'medium', 'high'),
          allowNull: false,
          defaultValue: 'medium',
          comment: 'Recording quality'
      },
      recording_source: {
          type: DataTypes.ENUM('microphone', 'voice_call', 'voice_communication', 'voice_recognition'),
          allowNull: true,
          comment: 'Audio source used for recording'
      },
      transcription: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Text transcription of the call (if available)'
      },
      transcription_confidence: {
          type: DataTypes.FLOAT,
          allowNull: true,
          comment: 'Confidence score of transcription (0-1)'
      },
      call_direction: {
          type: DataTypes.ENUM('inbound', 'outbound'),
          allowNull: false,
          comment: 'Direction of the call'
      },
      sim_slot: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: 'SIM slot used for the call (0, 1, etc.)'
      },
      network_type: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Network type during call (2G, 3G, 4G, 5G, WiFi)'
      },
      call_state_changes: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Array of call state changes with timestamps'
      },
      metadata: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Additional metadata about the call and recording'
      },
      upload_timestamp: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
          comment: 'When the recording was uploaded to server'
      },
      is_processed: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: 'Whether the recording has been processed/analyzed'
      },
      processing_status: {
          type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
          defaultValue: 'pending',
          comment: 'Status of recording processing'
      },
      tags: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Tags for categorizing recordings'
      },
      notes: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Admin notes about the recording'
      },
      is_important: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: 'Whether this recording is marked as important'
      },
      is_deleted: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: 'Soft delete flag'
      }
  }, {
      tableName: 'call_recordings',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          name: 'idx_call_recordings_device_id',
          fields: ['deviceId']
        },
        {
          name: 'idx_call_recordings_call_log_id',
          fields: ['call_log_id']
        },
        {
          name: 'idx_call_recordings_phone_number',
          fields: ['phone_number']
        },
        {
          name: 'idx_call_recordings_call_type',
          fields: ['call_type']
        },
        {
          name: 'idx_call_recordings_call_direction',
          fields: ['call_direction']
        },
        {
          name: 'idx_call_recordings_call_start_time',
          fields: ['call_start_time']
        },
        {
          name: 'idx_call_recordings_is_deleted',
          fields: ['is_deleted']
        },
        // Composite indexes for common query patterns
        {
          name: 'idx_call_recordings_device_call_time',
          fields: ['deviceId', 'call_start_time']
        },
        {
          name: 'idx_call_recordings_direction_type',
          fields: ['call_direction', 'call_type']
        }
      ],
      hooks: {
        afterSync: async (options) => {
          const queryInterface = options.sequelize.getQueryInterface();
          const transaction = await options.sequelize.transaction();
          
          try {
            // First, remove any existing foreign key constraints with the same name
            await queryInterface.removeConstraint('call_recordings', 'call_recordings_device_id_fk', { transaction }).catch(() => {});
            await queryInterface.removeConstraint('call_recordings', 'call_recordings_call_log_id_fk', { transaction }).catch(() => {});
            
            // Also remove any automatically generated constraints
            await queryInterface.removeConstraint('call_recordings', 'call_recordings_ibfk_1', { transaction }).catch(() => {});
            await queryInterface.removeConstraint('call_recordings', 'call_recordings_ibfk_2', { transaction }).catch(() => {});
            
            // Add the foreign key constraint for device_id
            await queryInterface.addConstraint('call_recordings', {
              fields: ['deviceId'],
              type: 'foreign key',
              name: 'call_recordings_device_id_fk',
              references: { 
                table: 'devices', 
                field: 'deviceId'
              },
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE',
              transaction
            });
            
            // Add the foreign key constraint for call_log_id
            await queryInterface.addConstraint('call_recordings', {
              fields: ['call_log_id'],
              type: 'foreign key',
              name: 'call_recordings_call_log_id_fk',
              references: { 
                table: 'call_logs', 
                field: 'id' 
              },
              onDelete: 'SET NULL',
              onUpdate: 'CASCADE',
              transaction
            });
            
            await transaction.commit();
          } catch (error) {
            await transaction.rollback();
            console.error('Error setting up call_recordings foreign keys:', error);
          }
        }
      },
      indexes: [
          {
              name: 'idx_call_recordings_device_id',
              fields: ['deviceId']
          },
          {
              name: 'idx_call_recordings_phone_number',
              fields: ['phone_number']
          },
          {
              name: 'idx_call_recordings_call_type',
              fields: ['call_type']
          },
          {
              name: 'idx_call_recordings_call_start_time',
              fields: ['call_start_time']
          },
          {
              name: 'idx_call_recordings_call_direction',
              fields: ['call_direction']
          },
          {
              name: 'idx_call_recordings_upload_timestamp',
              fields: ['upload_timestamp']
          },
          {
              name: 'idx_call_recordings_is_important',
              fields: ['is_important']
          },
          {
              name: 'idx_call_recordings_is_deleted',
              fields: ['is_deleted']
          },
          {
              name: 'idx_call_recordings_processing_status',
              fields: ['processing_status']
          }
      ]
  });

  // Add model name for dynamic loading
  CallRecording.modelName = 'CallRecording';
  
  // Add syncWithDatabase method for special handling
  CallRecording.syncWithDatabase = async function(options = {}) {
    const queryInterface = this.sequelize.getQueryInterface();
    
    try {
      // Check if the constraint already exists
      const [results] = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME 
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
         WHERE TABLE_NAME = 'call_recordings' 
         AND CONSTRAINT_NAME = 'call_recordings_device_id_fk'`
      );
      
      // Only add the constraint if it doesn't exist
      if (!results || results.length === 0) {
        // Drop existing foreign key constraints if they exist
        await queryInterface.removeConstraint('call_recordings', 'call_recordings_ibfk_1').catch(() => {});
        await queryInterface.removeConstraint('call_recordings', 'call_recordings_device_id_fk').catch(() => {});
        
        // Sync the model
        await this.sync(options);
        
        // Add the correct foreign key constraint for device_id
        try {
          await queryInterface.addConstraint('call_recordings', {
            fields: ['deviceId'],
            type: 'foreign key',
            name: 'call_recordings_device_id_fk',
            references: { 
              table: 'devices', 
              field: 'deviceId'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          });
        } catch (constraintError) {
          // Ignore if constraint already exists
          if (!constraintError.message.includes('Duplicate')) {
            throw constraintError;
          }
        }
        
        // Add foreign key constraint for call_log_id if it doesn't exist
        const [callLogFkResults] = await queryInterface.sequelize.query(
          `SELECT CONSTRAINT_NAME 
           FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
           WHERE TABLE_NAME = 'call_recordings' 
           AND COLUMN_NAME = 'call_log_id' 
           AND REFERENCED_TABLE_NAME = 'call_logs'`
        );
        
        if (!callLogFkResults || callLogFkResults.length === 0) {
          await queryInterface.addConstraint('call_recordings', {
            fields: ['call_log_id'],
            type: 'foreign key',
            name: 'call_recordings_call_log_id_fk',
            references: { 
              table: 'call_logs', 
              field: 'id' 
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
          });
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error syncing CallRecording model:', error);
      return false;
    }
  };
  
  return CallRecording;
};
