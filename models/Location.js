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
      indexes: [      {
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

  /**
   * Robust sync helper that fixes FK if the underlying column differs (deviceId vs device_id).
   * It:
   *  - creates table if not exists
   *  - runs alter sync otherwise
   *  - ensures a FK constraint exists on the correct column name
   */
  Location.syncWithDatabase = async function(options = {}) {
    const queryInterface = this.sequelize.getQueryInterface();
    const transaction = await this.sequelize.transaction();
    try {
      // Ensure table exists / sync with alter if needed
      const [tables] = await queryInterface.sequelize.query(
        "SHOW TABLES LIKE 'device_locations'"
      );
      if (!tables || tables.length === 0) {
        await this.sync({ ...options, transaction });
      } else {
        // Table exists, handle existing columns
        await this.sync({ ...options, alter: true, transaction });
      }

      // Inspect columns to find the FK column name: prefer 'deviceId', fallback to 'device_id'
      const [columns] = await queryInterface.sequelize.query("SHOW COLUMNS FROM `device_locations`", { transaction });
      const columnNames = (columns || []).map(c => c.Field);

      // determine actual fk column name
      let fkColumn = null;
      if (columnNames.includes('deviceId')) fkColumn = 'deviceId';
      else if (columnNames.includes('device_id')) fkColumn = 'device_id';
      else {
        // If neither exists, create the expected camelCase column
        await queryInterface.addColumn('device_locations', 'deviceId', {
          type: DataTypes.STRING,
          allowNull: false
        }, { transaction });
        fkColumn = 'deviceId';
      }

      // Remove likely existing constraints (be generous in names) - ignore errors
      const possibleConstraintNames = [
        'device_locations_device_id_fk',
        'device_locations_ibfk_1',
        'device_locations_deviceId_fk',
        'fk_device_locations_device'
      ];
      for (const name of possibleConstraintNames) {
        // removeConstraint can throw if not exists, swallow errors
        await queryInterface.removeConstraint('device_locations', name, { transaction }).catch(() => {});
      }

      // Add the correct foreign key constraint referencing the devices table.
      // Determine target field name on devices table: check devices table columns similarly.
      const [deviceColumns] = await queryInterface.sequelize.query("SHOW COLUMNS FROM `devices`", { transaction });
      const deviceColumnNames = (deviceColumns || []).map(c => c.Field);
      // Prefer deviceId on devices, else device_id
      const targetField = deviceColumnNames.includes('deviceId') ? 'deviceId' : (deviceColumnNames.includes('device_id') ? 'device_id' : 'deviceId');

      // finally add FK constraint
      const fkName = `device_locations_${fkColumn}_fk`;
      await queryInterface.addConstraint('device_locations', {
        fields: [fkColumn],
        type: 'foreign key',
        name: fkName,
        references: {
          table: 'devices',
          field: targetField
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
