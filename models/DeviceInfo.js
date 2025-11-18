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
      hooks: {
        afterSync: async (options) => {
          const queryInterface = options.sequelize.getQueryInterface();
          const transaction = await options.sequelize.transaction();
          
          try {
            // Drop existing foreign key constraints if they exist
            await queryInterface.removeConstraint('device_info', 'device_info_ibfk_1', { transaction }).catch(() => {});
            await queryInterface.removeConstraint('device_info', 'device_info_device_id_fk', { transaction }).catch(() => {});
            
            // Add the correct foreign key constraint
            await queryInterface.addConstraint('device_info', {
              fields: ['deviceId'],
              type: 'foreign key',
              name: 'device_info_device_id_fk',
              references: { 
                table: 'devices', 
                field: 'deviceId' 
              },
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE',
              transaction
            });
            
            await transaction.commit();
          } catch (error) {
            await transaction.rollback();
            console.error('Error setting up DeviceInfo foreign keys:', error);
            throw error;
          }
        }
      }
  });

  // Add syncWithDatabase method for special handling
  DeviceInfo.syncWithDatabase = async function(options = {}) {
    const queryInterface = this.sequelize.getQueryInterface();
    
    try {
      // Check if the table exists
      const [tables] = await queryInterface.sequelize.query(
        "SHOW TABLES LIKE 'device_info'"
      );
      
      if (tables.length === 0) {
        // Table doesn't exist, create it with sync
        await this.sync(options);
      } else {
        // Table exists, handle existing columns carefully
        const [columns] = await queryInterface.sequelize.query(
          'DESCRIBE device_info'
        );
        
        const columnNames = columns.map(col => col.Field);
        
        // Add missing columns manually to avoid timestamp issues
        if (!columnNames.includes('created_at')) {
          await queryInterface.addColumn('device_info', 'created_at', {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
          });
          
          // Update existing rows to have a valid date
          await queryInterface.sequelize.query(
            "UPDATE device_info SET created_at = NOW() WHERE created_at IS NULL"
          );
          
          // Now alter the column to be NOT NULL
          await queryInterface.changeColumn('device_info', 'created_at', {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
          });
        }
        
        if (!columnNames.includes('updated_at')) {
          await queryInterface.addColumn('device_info', 'updated_at', {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
          });
          
          // Update existing rows to have a valid date
          await queryInterface.sequelize.query(
            "UPDATE device_info SET updated_at = NOW() WHERE updated_at IS NULL"
          );
          
          // Now alter the column to be NOT NULL
          await queryInterface.changeColumn('device_info', 'updated_at', {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
          });
        }
      }
      
      // Ensure the foreign key constraint is set up correctly
      await queryInterface.removeConstraint('device_info', 'device_info_ibfk_1').catch(() => {});
      await queryInterface.removeConstraint('device_info', 'device_info_device_id_fk').catch(() => {});
      
      await queryInterface.addConstraint('device_info', {
        fields: ['deviceId'],
        type: 'foreign key',
        name: 'device_info_device_id_fk',
        references: { 
          table: 'devices', 
          field: 'deviceId' 
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      
      return true;
    } catch (error) {
      console.error('Error syncing DeviceInfo model:', error);
      throw error;
    }
  };

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
