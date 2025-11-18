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
        key: 'deviceId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
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
    underscored: false,
    indexes: [
      {
        name: 'idx_location_device_id',
        fields: ['deviceId']
      },
      {
        name: 'idx_location_timestamp',
        fields: ['timestamp']
      },
      {
        name: 'idx_location_coordinates',
        fields: ['latitude', 'longitude'],
        using: 'BTREE'
      },
      {
        name: 'idx_location_provider',
        fields: ['provider']
      },
      {
        name: 'idx_location_created_at',
        fields: ['created_at']
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

  // Add syncWithDatabase method for special handling
  Location.syncWithDatabase = async function(options = {}) {
    const queryInterface = this.sequelize.getQueryInterface();
    const transaction = await this.sequelize.transaction();
    
    try {
      // Check if the table exists
      const [tables] = await queryInterface.sequelize.query(
        "SHOW TABLES LIKE 'device_locations'"
      );
      
      if (tables.length === 0) {
        // Table doesn't exist, create it with sync
        await this.sync({ ...options, transaction });
      } else {
        // Table exists, handle existing columns
        await this.sync({ ...options, alter: true, transaction });
      }
      
      // Drop existing foreign key constraints if they exist
      await queryInterface.removeConstraint('device_locations', 'device_locations_ibfk_1', { transaction }).catch(() => {});
      await queryInterface.removeConstraint('device_locations', 'device_locations_device_id_fk', { transaction }).catch(() => {});
      
      // Add the correct foreign key constraint
      await queryInterface.addConstraint('device_locations', {
        fields: ['device_id'],
        type: 'foreign key',
        name: 'device_locations_device_id_fk',
        references: { 
          table: 'devices', 
          field: 'device_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        transaction
      });
      
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      console.error('Error syncing Location model:', error);
      throw error;
    }
  };

  return Location;
};
