const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const DeviceInfo = sequelize.define('DeviceInfo', {
      id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
      },
      deviceId: {
          type: DataTypes.STRING,
          field: 'deviceId',
          allowNull: false,
          comment: 'Reference to devices table (deviceId)',
          references: {
              model: 'devices',
              key: 'deviceId',
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE'
          },
          validate: {
              notEmpty: {
                  msg: 'Device ID is required'
              }
          }
      },
      hardwareInfo: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Hardware specifications',
          field: 'hardware_info'
      },
      softwareInfo: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Software and OS information',
          field: 'software_info'
      },
      networkInfo: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Network configuration and status',
          field: 'network_info'
      },
      securityInfo: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Security settings and status',
          field: 'security_info'
      },
      installedApps: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'List of installed applications',
          field: 'installed_apps'
      },
      systemSettings: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'System settings and configurations',
          field: 'system_settings'
      },
      permissions: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'App permissions status',
          defaultValue: {}
      },
      batteryLevel: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
              min: 0,
              max: 100
          },
          comment: 'Battery level percentage',
          field: 'battery_level'
      },
      storageInfo: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Storage information including total and free space',
          field: 'storage_info'
      },
      displayInfo: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Display information (resolution, density, etc.)',
          field: 'display_info'
      },
      sensors: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Available sensors information'
      },
      last_updated: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
      }
  }, {
      tableName: 'device_info',
      timestamps: true, // Disable automatic timestamps
      paranoid: false,
      underscored: false,
            indexes: [
          {
              name: 'idx_device_info_device_id',
              fields: ['deviceId'],
              unique: true
          },
          {
              name: 'idx_device_info_last_updated',
              fields: ['last_updated']
          }
      ],

  });

  // Define associations
  DeviceInfo.associate = function(models) {
    // Device association
    DeviceInfo.belongsTo(models.Device, {
      foreignKey: {
        name: 'deviceId',
        field: 'deviceId'
      },
      targetKey: 'deviceId',
      as: 'device',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  };

  // Add indexes
  DeviceInfo.addHook('afterSync', 'addIndexes', async (options) => {
    const transaction = options.transaction;
    const queryInterface = DeviceInfo.sequelize.getQueryInterface();
    
    // Add index for deviceId since it's used in lookups
    const indexes = await queryInterface.showIndex(DeviceInfo.tableName);
    const hasDeviceIdIndex = indexes.some(idx => 
      idx.name === 'idx_device_info_device_id' || 
      idx.fields.some(field => field === 'deviceId' || field.name === 'deviceId')
    );
    
    if (!hasDeviceIdIndex) {
      await queryInterface.addIndex(DeviceInfo.tableName, ['deviceId'], {
        name: 'idx_device_info_device_id',
        transaction
      });
    }
  });

  // Add hooks for data validation and transformation
  DeviceInfo.beforeValidate((deviceInfo) => {
    // Ensure JSON fields are properly formatted
    const jsonFields = [
      'hardwareInfo', 'softwareInfo', 'networkInfo', 
      'securityInfo', 'installedApps', 'systemSettings',
      'permissions', 'storageInfo', 'displayInfo'
    ];
    
    jsonFields.forEach(field => {
      if (deviceInfo[field] && typeof deviceInfo[field] === 'string') {
        try {
          deviceInfo[field] = JSON.parse(deviceInfo[field]);
        } catch (e) {
          // If parsing fails, set to null or empty object based on field
          deviceInfo[field] = field === 'permissions' ? {} : null;
        }
      }
    });
  });

  return DeviceInfo;
};
