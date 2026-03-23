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
      field: 'device_id',
      references: {
        model: 'devices',
        key: 'device_id'
      }
    },

    callLogId: {
      type: DataTypes.UUID,
      field: 'call_log_id',
      references: {
        model: 'call_logs',
        key: 'id'
      }
    },

    phoneNumber: {
      type: DataTypes.STRING,
      field: 'phone_number',
      allowNull: false
    },

    contactName: {
      type: DataTypes.STRING,
      field: 'contact_name'
    },

    callType: {
      type: DataTypes.ENUM('incoming', 'outgoing', 'missed', 'rejected', 'blocked'),
      field: 'call_type',
      allowNull: false
    },

    callStartTime: {
      type: DataTypes.DATE,
      field: 'call_start_time',
      allowNull: false
    },

    callEndTime: {
      type: DataTypes.DATE,
      field: 'call_end_time'
    },

    callDuration: {
      type: DataTypes.INTEGER,
      field: 'call_duration'
    },

    recordingFilePath: {
      type: DataTypes.STRING,
      field: 'recording_file_path',
      allowNull: false
    },

    recordingFileName: {
      type: DataTypes.STRING,
      field: 'recording_file_name',
      allowNull: false
    },

    recordingFileSize: {
      type: DataTypes.BIGINT,
      field: 'recording_file_size'
    },

    recordingDuration: {
      type: DataTypes.INTEGER,
      field: 'recording_duration'
    },

    recordingFormat: {
      type: DataTypes.STRING,
      field: 'recording_format',
      defaultValue: 'mp3'
    },

    recordingQuality: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      field: 'recording_quality',
      defaultValue: 'medium'
    },

    recordingSource: {
      type: DataTypes.ENUM('microphone', 'voice_call', 'voice_communication', 'voice_recognition'),
      field: 'recording_source'
    },

    transcription: DataTypes.TEXT,

    transcriptionConfidence: {
      type: DataTypes.FLOAT,
      field: 'transcription_confidence'
    },

    callDirection: {
      type: DataTypes.ENUM('inbound', 'outbound'),
      field: 'call_direction',
      allowNull: false
    },

    simSlot: {
      type: DataTypes.INTEGER,
      field: 'sim_slot'
    },

    networkType: {
      type: DataTypes.STRING,
      field: 'network_type'
    },

    callStateChanges: {
      type: DataTypes.JSON,
      field: 'call_state_changes'
    },

    metadata: DataTypes.JSON,

    uploadTimestamp: {
      type: DataTypes.DATE,
      field: 'upload_timestamp',
      defaultValue: DataTypes.NOW
    },

    isProcessed: {
      type: DataTypes.BOOLEAN,
      field: 'is_processed',
      defaultValue: false
    },

    processingStatus: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      field: 'processing_status',
      defaultValue: 'pending'
    },

    tags: DataTypes.JSON,

    notes: DataTypes.TEXT,

    isImportant: {
      type: DataTypes.BOOLEAN,
      field: 'is_important',
      defaultValue: false
    },

    isDeleted: {
      type: DataTypes.BOOLEAN,
      field: 'is_deleted',
      defaultValue: false
    }

  }, {
    tableName: 'call_recordings',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['device_id'] },
      { fields: ['device_id', 'call_start_time'] },
      { fields: ['phone_number'] },
      { fields: ['call_type'] },
      { fields: ['call_direction'] },
      { fields: ['upload_timestamp'] },
      { fields: ['processing_status'] },
      { fields: ['is_deleted'] },
      { fields: ['call_log_id'] }
    ]
  });

  CallRecording.associate = (models) => {
    CallRecording.belongsTo(models.Device, {
      foreignKey: 'deviceId',
      targetKey: 'deviceId',
      as: 'device'
    });

    CallRecording.belongsTo(models.CallLog, {
      foreignKey: 'callLogId',
      as: 'callLog'
    });
  };

  return CallRecording;
};