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
      field: 'device_id',
      allowNull: false
    },

    packageName: {
      type: DataTypes.STRING,
      field: 'package_name',
      allowNull: false
    },

    appName: {
      type: DataTypes.STRING,
      field: 'app_name',
      allowNull: false
    },

    versionName: {
      type: DataTypes.STRING,
      field: 'version_name'
    },

    versionCode: {
      type: DataTypes.INTEGER,
      field: 'version_code'
    },

    installTime: {
      type: DataTypes.DATE,
      field: 'install_time'
    },

    updateTime: {
      type: DataTypes.DATE,
      field: 'update_time'
    },

    appSize: {
      type: DataTypes.BIGINT,
      field: 'app_size'
    },

    isSystemApp: {
      type: DataTypes.BOOLEAN,
      field: 'is_system_app',
      defaultValue: false
    },

    isEnabled: {
      type: DataTypes.BOOLEAN,
      field: 'is_enabled',
      defaultValue: true
    },

    permissions: DataTypes.JSON,

    lastUsed: {
      type: DataTypes.DATE,
      field: 'last_used'
    },

    installSource: {
      type: DataTypes.STRING,
      field: 'install_source'
    },

    minSdkVersion: {
      type: DataTypes.INTEGER,
      field: 'min_sdk_version'
    },

    targetSdkVersion: {
      type: DataTypes.INTEGER,
      field: 'target_sdk_version'
    },

    iconData: {
      type: DataTypes.TEXT,
      field: 'icon_data'
    },

    syncTimestamp: {
      type: DataTypes.DATE,
      field: 'sync_timestamp',
      defaultValue: DataTypes.NOW
    },

    isDeleted: {
      type: DataTypes.BOOLEAN,
      field: 'is_deleted',
      defaultValue: false
    }

  }, {
    tableName: 'installed_apps',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['device_id'] },
      { fields: ['package_name'] },
      { fields: ['is_system_app'] },
      { fields: ['install_time'] },
      { fields: ['update_time'] }
    ]
  });

  InstalledApp.associate = (models) => {
    InstalledApp.belongsTo(models.Device, {
      foreignKey: 'deviceId',
      targetKey: 'deviceId',
      as: 'device'
    });
  };

  return InstalledApp;
};