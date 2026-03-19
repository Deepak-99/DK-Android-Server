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
      field: 'deviceId',
      references: {
        model: 'devices',
        key: 'deviceId'
      },
      comment: 'Reference to devices table (deviceId)'
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false
    },
    altitude: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    accuracy: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      comment: 'GPS accuracy in meters'
    },
    speed: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      comment: 'Speed in m/s'
    },
    bearing: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      comment: 'Bearing in degrees'
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'GPS, NETWORK, PASSIVE, etc.'
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reverse geocoded address'
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    battery_level: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    network_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    is_mock: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether location is from mock provider'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
      tableName: 'device_locations',
      timestamps: true,
      paranoid: false,
      underscored: false,
      indexes: [
          {
              name: 'idx_location_device',
              fields: ['deviceId']
          },
          {
              name: 'idx_location_device_time',
              fields: ['deviceId', 'timestamp']
          },
          {
              name: 'idx_location_time',
              fields: ['timestamp']
          },
          {
              name: 'idx_location_provider',
              fields: ['provider']
          }
      ],
    hooks: {
      beforeValidate: (location) => {
        location.updated_at = new Date();
        if (location.isNewRecord) {
          location.created_at = new Date();
        }
      }
    }
  });

  // Define associations
  Location.associate = (models) => {
    Location.belongsTo(models.Device, {
      foreignKey: 'deviceId',
      targetKey: 'deviceId',
      as: 'device'
    });
  };

  return Location;
};
