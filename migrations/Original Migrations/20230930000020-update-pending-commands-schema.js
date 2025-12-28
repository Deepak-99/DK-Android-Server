'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'pending_commands';
    
    try {
      // Check if table exists (case-insensitive check)
      const [tables] = await queryInterface.sequelize.query(
        `SHOW TABLES LIKE '${tableName}'`,
        { transaction }
      );
      
      // If table doesn't exist, create it
      if (tables.length === 0) {
        await queryInterface.createTable(tableName, {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
          },
          device_id: {
            type: Sequelize.STRING,
            allowNull: false,
            field: 'device_id',  // Maps to device_id column in the database
            references: {
              model: 'devices',
              key: 'device_id'   // Reference to the device_id column in devices table
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: 'Reference to devices table (device_id)'
          },
          command_type: {
            type: Sequelize.STRING,
            allowNull: false
          },
          command_data: {
            type: Sequelize.JSON,  // Changed from JSONB to JSON for MySQL compatibility
            allowNull: false,
            field: 'commandData'  // Use camelCase in JavaScript, snake_case in database
          },
          priority: {
            type: Sequelize.INTEGER,
            defaultValue: 0
          },
          scheduled_at: {
            type: Sequelize.DATE,
            allowNull: true
          },
          expires_at: {
            type: Sequelize.DATE,
            allowNull: true
          },
          status: {
            type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'),
            defaultValue: 'pending'
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

      // If table exists, add any missing columns and indexes
      if (tables.length > 0) {
        const columns = await queryInterface.describeTable(tableName, { transaction });
        
        // Add device_id column if it doesn't exist
        if (!columns.device_id) {
          console.log('Adding device_id column to', tableName);
          await queryInterface.addColumn(
            tableName,
            'device_id',
            {
              type: Sequelize.STRING,
              field: 'device_id',
              allowNull: false,
              references: {
                model: 'devices',
                key: 'device_id'
              },
              onUpdate: 'CASCADE',
              onDelete: 'CASCADE',
              comment: 'Reference to devices table (device_id)'
            },
            { transaction }
          );
        }
        
        // Add priority column if it doesn't exist
        if (!columns.priority) {
          await queryInterface.addColumn(tableName, 'priority', {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false
          }, { transaction });
        }

        // Add expires_at column if it doesn't exist
        if (!columns.expires_at) {
          await queryInterface.addColumn(tableName, 'expires_at', {
            type: Sequelize.DATE,
            allowNull: true
          }, { transaction });
        }

        // Get existing indexes
        const [indexes] = await queryInterface.sequelize.query(
          `SHOW INDEX FROM ${tableName}`,
          { transaction }
        );
        const indexNames = [...new Set(indexes.map(idx => idx.Key_name))];
        
        // Add indexes if they don't exist
        const indexesToAdd = [
          { name: 'idx_pending_commands_device_id', columns: ['device_id'] },
          { name: 'idx_pending_commands_status', columns: ['status'] },
          { name: 'idx_pending_commands_scheduled_at', columns: ['scheduled_at'] },
          { name: 'idx_pending_commands_priority', columns: ['priority'] }
        ];
        
        for (const idx of indexesToAdd) {
          if (!indexNames.includes(idx.name)) {
            await queryInterface.addIndex(tableName, idx.columns, {
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
