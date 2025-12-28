const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
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
        notEmpty: { msg: 'Device ID is required' },
        len: { args: [5, 255], msg: 'Device ID must be between 5 and 255 characters' }
      }
    },
    name: { type: DataTypes.STRING, allowNull: true },
    nickname: { type: DataTypes.STRING(255), allowNull: true },
    model: { type: DataTypes.STRING, allowNull: true },
    manufacturer: { type: DataTypes.STRING, allowNull: true },
    os: { type: DataTypes.STRING, allowNull: true },
    osVersion: { type: DataTypes.STRING, allowNull: true, field: 'os_version' },
    isOnline: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_online' },
    lastSeen: { type: DataTypes.DATE, field: 'lastSeen', allowNull: true },
    ipAddress: { type: DataTypes.STRING, field: 'ip_address', allowNull: true, validate: { isIP: true } },
    macAddress: { type: DataTypes.STRING, field: 'macAddress', allowNull: true },
    userId: { type: DataTypes.INTEGER, field: 'userId', allowNull: true, references: { model: 'users', key: 'id' } },
    settings: {
      type: DataTypes.TEXT,
      field: 'settings',
      allowNull: true,
      get() {
        const raw = this.getDataValue('settings');
        return raw ? JSON.parse(raw) : null;
      },
      set(value) {
        this.setDataValue('settings', value ? JSON.stringify(value) : null);
      }
    },
    status: {
      type: DataTypes.ENUM('online','offline','active','inactive','suspended'),
      field: 'status',
      allowNull: false,
      defaultValue: 'offline'
    },
    imei: { type: DataTypes.STRING, field: 'imei', allowNull: true },
    phoneNumber: { type: DataTypes.STRING, field: 'phone_number', allowNull: true },
    registrationDate: { type: DataTypes.DATE, field: 'registration_date', allowNull: true },
    appVersion: { type: DataTypes.STRING, field: 'app_version', allowNull: true },
    batteryLevel: { type: DataTypes.INTEGER, field: 'battery_level', allowNull: true, validate: { min: 0, max: 100 } },
    isCharging: { type: DataTypes.BOOLEAN, field: 'is_charging', allowNull: false, defaultValue: false },
    networkType: { type: DataTypes.STRING, field: 'network_type', allowNull: true },
    locationEnabled: { type: DataTypes.BOOLEAN, field: 'location_enabled', allowNull: false, defaultValue: false },
    cameraEnabled: { type: DataTypes.BOOLEAN, field: 'camera_enabled', allowNull: false, defaultValue: false },
    microphoneEnabled: { type: DataTypes.BOOLEAN, field: 'microphone_enabled', allowNull: false, defaultValue: false }
  }, {
    tableName: 'devices',
    timestamps: true,
    underscored: false, // keep false if DB columns for created/updated are camelCase or your DB uses 'created_at' but you want camel props, adjust accordingly
    paranoid: true,
    indexes: [
      { fields: ['deviceId'], name: 'idx_devices_deviceId', unique: true },
      { fields: ['userId','status'], name: 'idx_user_status' },
      { fields: ['imei'], name: 'idx_imei' }
    ]
  });

  Device.associate = (models) => {
    Device.belongsTo(models.User, { foreignKey: 'userId', as: 'user', onDelete: 'SET NULL', onUpdate: 'CASCADE' });

    Device.hasMany(models.Command, { foreignKey: 'deviceId', sourceKey: 'deviceId', as: 'commands', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

    Device.hasOne(models.DeviceInfo, { foreignKey: { name: 'deviceId', field: 'deviceId' }, sourceKey: 'deviceId', as: 'deviceInfo', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

    Device.hasMany(models.Location, { foreignKey: 'deviceId', sourceKey: 'deviceId', as: 'locations', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

    // other associations remain unchanged...
  };

    Device.hasMany(models.CallRecording, {
        foreignKey: 'deviceId',
        as: 'callRecordings'
    });

    Device.hasMany(models.ScreenRecording, {
        foreignKey: 'deviceId',
        as: 'screenRecordings'
    });

    Device.hasMany(models.Screenshot, {
        foreignKey: 'deviceId',
        as: 'screenshots'
    });

  return Device;
};
