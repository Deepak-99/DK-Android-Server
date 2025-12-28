'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'device_locations';
    
    try {
      // Check if table exists
      const [tables] = await queryInterface.sequelize.query(
        `SHOW TABLES LIKE '${tableName}'`,
        { transaction }
      );
      
      if (tables.length === 0) {
        // If table doesn't exist, create it with the correct schema
        await queryInterface.createTable(tableName, {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          device_id: {
            type: Sequelize.STRING(255),
            allowNull: false,
            references: {
              model: 'devices',
              key: 'device_id'  // Updated to reference the correct column in devices table
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: 'Reference to devices table (device_id)'
          },
          latitude: {
            type: Sequelize.DECIMAL(10, 8),
            allowNull: false,
            comment: 'Latitude coordinate'
          },
          longitude: {
            type: Sequelize.DECIMAL(11, 8),
            allowNull: false,
            comment: 'Longitude coordinate'
          },
          altitude: {
            type: Sequelize.DECIMAL(8, 2),
            allowNull: true,
            comment: 'Altitude in meters'
          },
          accuracy: {
            type: Sequelize.DECIMAL(8, 2),
            allowNull: true,
            comment: 'GPS accuracy in meters'
          },
          speed: {
            type: Sequelize.DECIMAL(8, 2),
            allowNull: true,
            comment: 'Speed in m/s'
          },
          bearing: {
            type: Sequelize.DECIMAL(6, 2),
            allowNull: true,
            comment: 'Bearing in degrees'
          },
          provider: {
            type: Sequelize.STRING(50),
            allowNull: true,
            comment: 'Location provider (gps, network, fused, etc.)'
          },
          address: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Reverse geocoded address'
          },
          timestamp: {
            type: Sequelize.DATE,
            allowNull: false,
            comment: 'When the location was recorded on the device'
          },
          battery_level: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Battery percentage when location was recorded',
            validate: {
              min: 0,
              max: 100
            }
          },
          network_type: {
            type: Sequelize.STRING(50),
            allowNull: true,
            comment: 'Type of network when location was recorded'
          },
          is_mock: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            comment: 'Whether the location is from a mock provider'
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
          }
        }, { transaction });
        
        // Add indexes
        await queryInterface.addIndex(tableName, ['device_id'], {
          name: 'idx_device_locations_device_id',
          transaction
        });
        
        await queryInterface.addIndex(tableName, ['timestamp'], {
          name: 'idx_device_locations_timestamp',
          transaction
        });
        
        await queryInterface.addIndex(tableName, ['latitude', 'longitude'], {
          name: 'idx_device_locations_lat_lng',
          transaction
        });
        
        await transaction.commit();
        return;
      }
      
      // Table exists, check and make necessary changes
      const columns = await queryInterface.describeTable(tableName, { transaction });
      
      // Add missing columns
      if (!columns.address) {
        await queryInterface.addColumn(
          tableName,
          'address',
          {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Reverse geocoded address',
            after: 'provider'
          },
          { transaction }
        );
      }
      
      if (!columns.network_type) {
        await queryInterface.addColumn(
          tableName,
          'network_type',
          {
            type: Sequelize.STRING(50),
            allowNull: true,
            comment: 'Type of network when location was recorded',
            after: 'battery_level'
          },
          { transaction }
        );
      }
      
      // Handle is_mock vs is_mocked
      if (!columns.is_mock && columns.is_mocked) {
        // Rename is_mocked to is_mock
        await queryInterface.renameColumn(
          tableName,
          'is_mocked',
          'is_mock',
          { transaction }
        );
      } else if (!columns.is_mock && !columns.is_mocked) {
        // Add is_mock if neither exists
        await queryInterface.addColumn(
          tableName,
          'is_mock',
          {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            comment: 'Whether the location is from a mock provider',
            after: 'network_type'
          },
          { transaction }
        );
      }
      
      // Change id from INTEGER to UUID if needed
      if (columns.id && columns.id.type === 'int unsigned') {
        // Create a temporary table with the new schema
        await queryInterface.createTable('device_locations_new', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          device_id: {
            type: Sequelize.STRING(255),
            allowNull: false,
            references: {
              model: 'devices',
              key: 'device_id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          latitude: {
            type: Sequelize.DECIMAL(10, 8),
            allowNull: false
          },
          longitude: {
            type: Sequelize.DECIMAL(11, 8),
            allowNull: false
          },
          altitude: {
            type: Sequelize.DECIMAL(8, 2),
            allowNull: true
          },
          accuracy: {
            type: Sequelize.DECIMAL(8, 2),
            allowNull: true
          },
          speed: {
            type: Sequelize.DECIMAL(8, 2),
            allowNull: true
          },
          bearing: {
            type: Sequelize.DECIMAL(6, 2),
            allowNull: true
          },
          provider: {
            type: Sequelize.STRING(50),
            allowNull: true
          },
          address: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          timestamp: {
            type: Sequelize.DATE,
            allowNull: false
          },
          battery_level: {
            type: Sequelize.INTEGER,
            allowNull: true
          },
          network_type: {
            type: Sequelize.STRING(50),
            allowNull: true
          },
          is_mock: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
          }
        }, { transaction });
        
        // Copy data from old table to new table
        await queryInterface.sequelize.query(
          `INSERT INTO device_locations_new 
           (id, device_id, latitude, longitude, altitude, accuracy, 
            speed, bearing, provider, address, timestamp, battery_level, 
            network_type, is_mock, created_at, updated_at)
           SELECT 
             UUID() as id, 
             device_id, 
             latitude, 
             longitude, 
             altitude, 
             accuracy, 
             speed, 
             bearing, 
             provider, 
             address, 
             timestamp, 
             battery_level, 
             network_type, 
             COALESCE(is_mock, is_mocked, false) as is_mock,
             COALESCE(created_at, NOW()) as created_at,
             COALESCE(updated_at, NOW()) as updated_at
           FROM device_locations`,
          { transaction }
        );
        
        // Drop old table and rename new one
        await queryInterface.dropTable('device_locations', { transaction });
        await queryInterface.renameTable('device_locations_new', 'device_locations', { transaction });
      }
      
      // Ensure timestamps are set up correctly
      const [timestampColumns] = await queryInterface.sequelize.query(
        `SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_NAME = 'device_locations' 
         AND COLUMN_NAME IN ('created_at', 'updated_at') 
         AND TABLE_SCHEMA = '${queryInterface.sequelize.config.database}'`,
        { transaction }
      );
      
      // Update timestamp columns to allow NULL if they don't already
      for (const column of ['created_at', 'updated_at']) {
        const colExists = timestampColumns.some(col => col.COLUMN_NAME === column);
        if (colExists) {
          await queryInterface.changeColumn(
            tableName,
            column,
            {
              type: Sequelize.DATE,
              allowNull: true,
              defaultValue: column === 'created_at' 
                ? Sequelize.literal('CURRENT_TIMESTAMP')
                : Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            },
            { transaction }
          );
        } else {
          await queryInterface.addColumn(
            tableName,
            column,
            {
              type: Sequelize.DATE,
              allowNull: true,
              defaultValue: column === 'created_at' 
                ? Sequelize.literal('CURRENT_TIMESTAMP')
                : Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            },
            { transaction }
          );
        }
      }
      
      // Add indexes if they don't exist
      const indexes = await queryInterface.showIndex(tableName, { transaction });
      
      if (!indexes.some(idx => idx.name === 'idx_device_locations_device_id')) {
        await queryInterface.addIndex(
          tableName,
          ['device_id'],
          {
            name: 'idx_device_locations_device_id',
            transaction
          }
        );
      }
      
      if (!indexes.some(idx => idx.name === 'idx_device_locations_timestamp')) {
        await queryInterface.addIndex(
          tableName,
          ['timestamp'],
          {
            name: 'idx_device_locations_timestamp',
            transaction
          }
        );
      }
      
      if (!indexes.some(idx => idx.name === 'idx_device_locations_lat_lng')) {
        await queryInterface.addIndex(
          tableName,
          ['latitude', 'longitude'],
          {
            name: 'idx_device_locations_lat_lng',
            transaction
          }
        );
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error in device_locations migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Note: This is a complex migration and cannot be fully rolled back automatically
    // due to the data transformation and potential data loss
    console.warn('Rollback not fully supported for this migration. Some changes may not be reversible.');
    
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'device_locations';
    
    try {
      // Remove added columns if they exist
      const columns = await queryInterface.describeTable(tableName, { transaction });
      
      if (columns.address) {
        await queryInterface.removeColumn(tableName, 'address', { transaction });
      }
      
      if (columns.network_type) {
        await queryInterface.removeColumn(tableName, 'network_type', { transaction });
      }
      
      // Handle is_mock vs is_mocked
      if (columns.is_mock && !columns.is_mocked) {
        await queryInterface.renameColumn(
          tableName,
          'is_mock',
          'is_mocked',
          { transaction }
        );
      }
      
      // Note: We cannot automatically revert the id type change from UUID to INTEGER
      // as it would require data migration and potential data loss
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error rolling back device_locations migration:', error);
      throw error;
    }
  }
};
