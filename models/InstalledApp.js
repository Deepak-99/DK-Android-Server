const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const InstalledApp = sequelize.define('InstalledApp', {
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
      packageName: {
          type: DataTypes.STRING,
          field: 'package_name',
          allowNull: false,
          comment: 'Unique package identifier'
      },
      appName: {
          type: DataTypes.STRING,
          field: 'app_name',
          allowNull: false,
          comment: 'Display name of the app'
      },
      versionName: {
          type: DataTypes.STRING,
          field: 'version_name',
          allowNull: true,
          comment: 'Version string (e.g., 1.0.0)'
      },
      versionCode: {
          type: DataTypes.INTEGER,
          field: 'version_code',
          allowNull: true,
          comment: 'Internal version number'
      },
      installTime: {
          type: DataTypes.DATE,
          field: 'install_time',
          allowNull: true,
          comment: 'When the app was installed'
      },
      updateTime: {
          type: DataTypes.DATE,
          field: 'update_time',
          allowNull: true,
          comment: 'When the app was last updated'
      },
      appSize: {
          type: DataTypes.BIGINT,
          field: 'app_size',
          allowNull: true,
          comment: 'App size in bytes'
      },
      dataSize: {
          type: DataTypes.BIGINT,
          field: 'data_size',
          allowNull: true,
          comment: 'App data size in bytes'
      },
      cacheSize: {
          type: DataTypes.BIGINT,
          field: 'cache_size',
          allowNull: true,
          comment: 'App cache size in bytes'
      },
      isSystemApp: {
          type: DataTypes.BOOLEAN,
          field: 'is_system_app',
          defaultValue: false,
          comment: 'Whether this is a system app'
      },
      isEnabled: {
          type: DataTypes.BOOLEAN,
          field: 'is_enabled',
          defaultValue: true,
          comment: 'Whether the app is enabled'
      },
      permissions: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'List of permissions granted to the app'
      },
      activities: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'List of app activities'
      },
      services: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'List of services provided by the app'
      },
      is_deleted: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: 'Soft delete flag'
      },
      created_by: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'User who created this record'
      },
      updated_by: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'User who last updated this record'
      },
      last_used: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'When the app was last used'
      },
      install_source: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Source of the app installation (e.g., Google Play, direct install)'
      },
      min_sdk_version: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: 'Minimum SDK version required by the app'
      },
      target_sdk_version: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: 'Target SDK version the app was built for'
      },
      first_install_time: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'When the app was first installed on the device'
      },
      last_update_time: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'When the app was last updated on the device'
      },
      requested_permissions: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'List of all permissions requested by the app'
      },
      granted_permissions: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'List of permissions granted to the app'
      },
      signatures: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'App signing signatures'
      },
      installer_package_name: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Package name of the app that installed this app (if any)'
      },
      split_names: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'List of split APK names (for split APK support)'
      },
      split_apks: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Information about split APKs'
      },
      receivers: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'List of broadcast receivers'
      },
      iconData: {
          type: DataTypes.TEXT,
          field: 'icon_data',
          allowNull: true,
          comment: 'Base64 encoded app icon'
      },
      targetSdkVersion: {
          field: 'target_sdk_version',
          type: DataTypes.INTEGER,
          allowNull: true
      },
      min_sdk_version: {
          type: DataTypes.INTEGER,
          allowNull: true
      },
      installer_package: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Package that installed this app'
      },
      sync_timestamp: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
      },
      isDeleted: {
          type: DataTypes.BOOLEAN,
          field: 'is_deleted',
          defaultValue: false,
          comment: 'Soft delete flag'
      }
    }, {
      tableName: 'installed_apps',
      timestamps: true,
      underscored: false,
      indexes: [
          {
              name: 'idx_installed_apps_device_id',
              fields: ['deviceId']
          },
          {
              name: 'idx_installed_apps_package_name',
              fields: ['packageName']
          },
          {
              name: 'idx_installed_apps_is_system',
              fields: ['isSystemApp']
          },
          {
              name: 'idx_installed_apps_install_time',
              fields: ['installTime']
          },
          {
              name: 'idx_installed_apps_update_time',
              fields: ['updateTime']
          },
          {
              name: 'idx_installed_apps_is_enabled',
              fields: ['isEnabled']
          }
      ]
  });

  // Define associations
  InstalledApp.associate = (models) => {
    if (models.Device) {
      InstalledApp.belongsTo(models.Device, {
        foreignKey: 'deviceId',
        targetKey: 'deviceId',
        as: 'device'
      });
    }
  };

  return InstalledApp;

  // Add a class method to sync the model with the database
  InstalledApp.syncWithDatabase = async (options = {}) => {
    const queryInterface = sequelize.getQueryInterface();
    try {
        // First sync the model to ensure the table exists
        await InstalledApp.sync(options);

        // Handle the unique index
        await queryInterface.removeIndex('installed_apps', 'idx_installed_apps_device_package').catch(() => {});
        
        // Add the unique index with the correct column names
        await queryInterface.addIndex('installed_apps', {
            fields: ['device_id', 'package_name'],
            name: 'idx_installed_apps_device_package',
            unique: true
        });

        return true;
    } catch (error) {
        console.error('Error syncing InstalledApp model:', error);
        throw error;
    }
  };

  return InstalledApp;
};
