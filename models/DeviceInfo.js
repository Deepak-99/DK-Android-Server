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
      allowNull: false,
      field: 'device_id',
      references: {
        model: 'devices',
        key: 'device_id'
      }
    },

    hardwareInfo: {
      type: DataTypes.JSON,
      field: 'hardware_info'
    },

    softwareInfo: {
      type: DataTypes.JSON,
      field: 'software_info'
    },

    networkInfo: {
      type: DataTypes.JSON,
      field: 'network_info'
    },

    securityInfo: {
      type: DataTypes.JSON,
      field: 'security_info'
    },

    installedApps: {
      type: DataTypes.JSON,
      field: 'installed_apps'
    },

    systemSettings: {
      type: DataTypes.JSON,
      field: 'system_settings'
    },

    permissions: {
      type: DataTypes.JSON,
      defaultValue: {}
    },

    batteryLevel: {
      type: DataTypes.INTEGER,
      field: 'battery_level',
      validate: { min: 0, max: 100 }
    },

    storageInfo: {
      type: DataTypes.JSON,
      field: 'storage_info'
    },

    displayInfo: {
      type: DataTypes.JSON,
      field: 'display_info'
    },

    sensors: DataTypes.JSON,

    lastUpdated: {
      type: DataTypes.DATE,
      field: 'last_updated',
      defaultValue: DataTypes.NOW
    }

  }, {
    tableName: 'device_info',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['device_id'], unique: true },
      { fields: ['last_updated'] }
    ]
  });

  DeviceInfo.associate = (models) => {
    DeviceInfo.belongsTo(models.Device, {
      foreignKey: 'deviceId',
      targetKey: 'deviceId',
      as: 'device'
    });
  };

  return DeviceInfo;
};