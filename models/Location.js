const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

  const Location = sequelize.define('Location', {

    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    deviceId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'device_id'
    },

    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false
    },

    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false
    },

    altitude: DataTypes.DECIMAL(8, 2),

    accuracy: DataTypes.DECIMAL(8, 2),

    speed: DataTypes.DECIMAL(8, 2),

    bearing: DataTypes.DECIMAL(6, 2),

    provider: DataTypes.STRING,

    address: DataTypes.TEXT,

    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },

    batteryLevel: {
      type: DataTypes.INTEGER,
      field: 'battery_level',
      validate: { min: 0, max: 100 }
    },

    networkType: {
      type: DataTypes.STRING,
      field: 'network_type'
    },

    isMock: {
      type: DataTypes.BOOLEAN,
      field: 'is_mock',
      defaultValue: false
    }

  }, {
    tableName: 'device_locations',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['device_id'] },
      { fields: ['device_id', 'timestamp'] },
      { fields: ['timestamp'] },
      { fields: ['provider'] }
    ]
  });

  Location.associate = (models) => {
    Location.belongsTo(models.Device, {
      foreignKey: 'deviceId',
      targetKey: 'deviceId',
      as: 'device'
    });
  };

  return Location;
};