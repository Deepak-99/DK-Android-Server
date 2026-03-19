const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const CallRecording = sequelize.define('CallRecording', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        deviceId: {
            type: DataTypes.STRING,
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
                name: 'idx_callrec_device',
                fields: ['deviceId']
            },
            {
                name: 'idx_callrec_device_time',
                fields: ['deviceId', 'call_start_time']
            },
            {
                name: 'idx_callrec_phone',
                fields: ['phone_number']
            },
            {
                name: 'idx_callrec_call_type',
                fields: ['call_type']
            },
            {
                name: 'idx_callrec_direction',
                fields: ['call_direction']
            },
            {
                name: 'idx_callrec_upload',
                fields: ['upload_timestamp']
            },
            {
                name: 'idx_callrec_processing',
                fields: ['processing_status']
            },
            {
                name: 'idx_callrec_deleted',
                fields: ['is_deleted']
            },
            {
                name: 'idx_callrec_call_log',
                fields: ['call_log_id']
            }
        ]
  });

  // Add model name for dynamic loading
  CallRecording.modelName = 'CallRecording';
  

  return CallRecording;
};
