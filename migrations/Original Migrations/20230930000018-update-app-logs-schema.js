'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if table exists
      const [tables] = await queryInterface.sequelize.query(
        "SHOW TABLES LIKE 'app_logs'"
      );
      
      // If table doesn't exist, create it
      if (tables.length === 0) {
        await queryInterface.createTable('app_logs', {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
          },
          device_id: {
            type: Sequelize.STRING(255),
            allowNull: false,
            field: 'device_id',  // Maps to device_id column in the database
            references: {
              model: 'devices',
              key: 'device_id'  // Reference to the device_id column in devices table
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: 'Reference to devices table (device_id)'
          },
          level: {
            type: Sequelize.ENUM('debug', 'info', 'warn', 'error'),
            allowNull: false,
            defaultValue: 'info'
          },
          message: {
            type: Sequelize.TEXT,
            allowNull: false
          },
          timestamp: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
          },
          metadata: {
            type: Sequelize.JSON,
            allowNull: true
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
          }
        });
      }

      // If table already exists, add any missing columns and indexes
      if (tables.length > 0) {
        const columns = await queryInterface.describeTable('app_logs');
        
        // Add device_id column if it doesn't exist (with proper reference to devices.deviceId)
        if (!columns.device_id) {
          await queryInterface.addColumn('app_logs', 'device_id', {
            type: Sequelize.STRING(255),
            field: 'device_id',
            allowNull: false,
            references: {
              model: 'devices',
              key: 'device_id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: 'Reference to devices table (device_id)'
          }, { transaction });
        }
        
        // Add metadata column if it doesn't exist
        if (!columns.metadata) {
          await queryInterface.addColumn('app_logs', 'metadata', {
            type: Sequelize.JSON,
            allowNull: true
          }, { transaction });
        }

        // Get existing indexes
        const [indexes] = await queryInterface.sequelize.query(
          'SHOW INDEX FROM app_logs'
        );
        const indexNames = [...new Set(indexes.map(idx => idx.Key_name))];
        
        // Add indexes if they don't exist
        const indexesToAdd = [
          { name: 'app_logs_device_id', columns: ['device_id'] },
          { name: 'app_logs_level', columns: ['level'] },
          { name: 'app_logs_timestamp', columns: ['timestamp'] }
        ];
        
        for (const idx of indexesToAdd) {
          if (!indexNames.includes(idx.name)) {
            await queryInterface.addIndex('app_logs', idx.columns, {
              name: idx.name,
              transaction
            });
          }
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // No down migration as this is a one-way update
  }
};
