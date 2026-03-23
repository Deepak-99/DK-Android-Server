module.exports = (sequelize, DataTypes) => {

  const Device = sequelize.define('Device', {

    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },

    deviceId: {
      type: DataTypes.STRING,
      field: 'device_id',
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Device ID is required' },
        len: { args: [5, 255], msg: 'Device ID must be between 5 and 255 characters' }
      }
    },

    name: DataTypes.STRING,

    nickname: DataTypes.STRING(255),

    model: DataTypes.STRING,

    manufacturer: DataTypes.STRING,

    os: DataTypes.STRING,

    osVersion: {
      type: DataTypes.STRING,
      field: 'os_version'
    },

    isOnline: {
      type: DataTypes.BOOLEAN,
      field: 'is_online',
      defaultValue: false
    },

    lastSeen: {
      type: DataTypes.DATE,
      field: 'last_seen'
    },

    ipAddress: {
      type: DataTypes.STRING,
      field: 'ip_address',
      validate: { isIP: true }
    },

    macAddress: {
      type: DataTypes.STRING,
      field: 'mac_address'
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'user_id'
    },

    settings: {
      type: DataTypes.TEXT,
      get() {
        const raw = this.getDataValue('settings');
        return raw ? JSON.parse(raw) : null;
      },
      set(value) {
        this.setDataValue('settings', value ? JSON.stringify(value) : null);
      }
    },

    status: {
      type: DataTypes.ENUM('online', 'offline', 'active', 'inactive', 'suspended'),
      defaultValue: 'offline'
    },

    imei: DataTypes.STRING,

    phoneNumber: {
      type: DataTypes.STRING,
      field: 'phone_number'
    },

    registrationDate: {
      type: DataTypes.DATE,
      field: 'registration_date'
    },

    appVersion: {
      type: DataTypes.STRING,
      field: 'app_version'
    },

    batteryLevel: {
      type: DataTypes.INTEGER,
      field: 'battery_level',
      validate: { min: 0, max: 100 }
    },

    isCharging: {
      type: DataTypes.BOOLEAN,
      field: 'is_charging',
      defaultValue: false
    },

    networkType: {
      type: DataTypes.STRING,
      field: 'network_type'
    },

    locationEnabled: {
      type: DataTypes.BOOLEAN,
      field: 'location_enabled',
      defaultValue: false
    },

    cameraEnabled: {
      type: DataTypes.BOOLEAN,
      field: 'camera_enabled',
      defaultValue: false
    },

    microphoneEnabled: {
      type: DataTypes.BOOLEAN,
      field: 'microphone_enabled',
      defaultValue: false
    }

  }, {
    tableName: 'devices',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        fields: ['device_id'],
        unique: true
      },
      {
        fields: ['user_id', 'status']
      },
      {
        fields: ['imei']
      }
    ]
  });

  /* ---------------- ASSOCIATIONS ---------------- */

  Device.associate = (models) => {

    Device.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    Device.hasMany(models.Command, {
      foreignKey: 'deviceId',
      sourceKey: 'deviceId',
      as: 'commands'
    });

    Device.hasOne(models.DeviceInfo, {
      foreignKey: 'deviceId',
      sourceKey: 'deviceId',
      as: 'deviceInfo'
    });

    Device.hasMany(models.Location, {
      foreignKey: 'deviceId',
      sourceKey: 'deviceId',
      as: 'locations'
    });

    Device.hasMany(models.CallRecording, {
      foreignKey: 'deviceId',
      sourceKey: 'deviceId',
      as: 'callRecordings'
    });

    Device.hasMany(models.ScreenRecording, {
      foreignKey: 'deviceId',
      sourceKey: 'deviceId',
      as: 'screenRecordings'
    });

    Device.hasMany(models.Screenshot, {
      foreignKey: 'deviceId',
      sourceKey: 'deviceId',
      as: 'screenshots'
    });
  };

  return Device;
};