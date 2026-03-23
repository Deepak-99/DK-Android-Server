const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

  const DeviceAudio = sequelize.define('DeviceAudio', {

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

    ringerMode: {
      type: DataTypes.ENUM('silent', 'vibrate', 'normal', 'unknown'),
      field: 'ringer_mode',
      defaultValue: 'unknown'
    },

    musicVolume: {
      type: DataTypes.INTEGER,
      field: 'music_volume',
      validate: { min: 0, max: 100 }
    },

    ringVolume: {
      type: DataTypes.INTEGER,
      field: 'ring_volume',
      validate: { min: 0, max: 100 }
    },

    callVolume: {
      type: DataTypes.INTEGER,
      field: 'call_volume',
      validate: { min: 0, max: 100 }
    },

    alarmVolume: {
      type: DataTypes.INTEGER,
      field: 'alarm_volume',
      validate: { min: 0, max: 100 }
    },

    notificationVolume: {
      type: DataTypes.INTEGER,
      field: 'notification_volume',
      validate: { min: 0, max: 100 }
    },

    systemVolume: {
      type: DataTypes.INTEGER,
      field: 'system_volume',
      validate: { min: 0, max: 100 }
    },

    isSpeakerOn: {
      type: DataTypes.BOOLEAN,
      field: 'is_speaker_on',
      defaultValue: false
    },

    isMicrophoneMuted: {
      type: DataTypes.BOOLEAN,
      field: 'is_microphone_muted',
      defaultValue: false
    },

    audioMode: {
      type: DataTypes.STRING,
      field: 'audio_mode'
    },

    bluetoothAudioConnected: {
      type: DataTypes.BOOLEAN,
      field: 'bluetooth_audio_connected',
      defaultValue: false
    },

    wiredHeadsetConnected: {
      type: DataTypes.BOOLEAN,
      field: 'wired_headset_connected',
      defaultValue: false
    },

    audioFocusState: {
      type: DataTypes.STRING,
      field: 'audio_focus_state'
    },

    recordingFilePath: {
      type: DataTypes.STRING,
      field: 'recording_file_path'
    },

    recordingDuration: {
      type: DataTypes.INTEGER,
      field: 'recording_duration'
    },

    recordingFormat: {
      type: DataTypes.STRING,
      field: 'recording_format'
    },

    recordingQuality: {
      type: DataTypes.STRING,
      field: 'recording_quality'
    },

    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }

  }, {
    tableName: 'device_audio',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['device_id'] },
      { fields: ['created_at'] },
      { fields: ['ringer_mode'] },
      { fields: ['timestamp'] }
    ]
  });

  DeviceAudio.associate = (models) => {
    DeviceAudio.belongsTo(models.Device, {
      foreignKey: 'deviceId',
      targetKey: 'deviceId',
      as: 'device'
    });
  };

  return DeviceAudio;
};