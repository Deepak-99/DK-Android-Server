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
      hooks: {
        afterSync: async (options) => {
          const queryInterface = options.sequelize.getQueryInterface();
          const transaction = await options.sequelize.transaction();
          
          try {
            // Check if the constraint already exists
            const [results] = await options.sequelize.query(
              `SELECT * FROM information_schema.table_constraints 
               WHERE constraint_schema = DATABASE() 
               AND table_name = 'device_audio' 
               AND constraint_name = 'device_audio_device_id_fk'`,
              { transaction }
            );
            
            // Only add the constraint if it doesn't exist
            if (results.length === 0) {
              // Drop any existing foreign key constraints if they exist
              await queryInterface.removeConstraint('device_audio', 'device_audio_ibfk_1', { transaction }).catch(() => {});
              
              // Add the correct foreign key constraint
              await queryInterface.addConstraint('device_audio', {
                fields: ['deviceId'],
                type: 'foreign key',
                name: 'device_audio_device_id_fk',
                references: { 
                  table: 'devices', 
                  field: 'deviceId' 
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
                transaction
              });
            }
            
            await transaction.commit();
          } catch (error) {
            await transaction.rollback();
            console.error('Error setting up device_audio foreign keys:', error);
          }
        }
      },
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
