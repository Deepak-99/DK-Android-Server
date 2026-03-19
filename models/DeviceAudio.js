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
          field: 'deviceId',
          references: {
              model: 'devices',
              key: 'deviceId',
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE'
          },
          comment: 'Reference to devices table (deviceId)'
      },
      ringer_mode: {
          type: DataTypes.ENUM('silent', 'vibrate', 'normal', 'unknown'),
          allowNull: false,
          defaultValue: 'unknown'
      },
      music_volume: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
              min: 0,
              max: 100
          },
          comment: 'Music/Media volume level (0-100)'
      },
      ring_volume: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
              min: 0,
              max: 100
          },
          comment: 'Ring volume level (0-100)'
      },
      call_volume: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
              min: 0,
              max: 100
          },
          comment: 'Call volume level (0-100)'
      },
      alarm_volume: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
              min: 0,
              max: 100
          },
          comment: 'Alarm volume level (0-100)'
      },
      notification_volume: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
              min: 0,
              max: 100
          },
          comment: 'Notification volume level (0-100)'
      },
      system_volume: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
              min: 0,
              max: 100
          },
          comment: 'System volume level (0-100)'
      },
      is_speaker_on: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: 'Whether speaker is enabled'
      },
      is_microphone_muted: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: 'Whether microphone is muted'
      },
      audio_mode: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Current audio mode (normal, in_call, in_communication, ringtone)'
      },
      bluetooth_audio_connected: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: 'Whether Bluetooth audio device is connected'
      },
      wired_headset_connected: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: 'Whether wired headset is connected'
      },
      audio_focus_state: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Current audio focus state'
      },
      recording_file_path: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Path to recorded audio file'
      },
      recording_duration: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: 'Duration of recording in seconds'
      },
      recording_format: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Audio recording format (mp3, wav, etc.)'
      },
      recording_quality: {
          type: DataTypes.STRING,
          comment: 'Recording quality setting'
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
          {
              name: 'idx_device_audio_device_id',
              fields: ['deviceId']
          },
          {
              name: 'idx_device_audio_created_at',
              fields: ['createdAt']
          },
          {
              name: 'idx_device_audio_ringer_mode',
              fields: ['ringer_mode']
          },
          {
              name: 'idx_device_audio_timestamp',
              fields: ['timestamp']
          }
      ]
  });

  // Define associations
  DeviceAudio.associate = function(models) {
    DeviceAudio.belongsTo(models.Device, {
      foreignKey: 'device_id',
      as: 'device'
    });
  };

  return DeviceAudio;
};
