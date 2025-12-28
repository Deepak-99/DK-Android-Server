'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if table exists (case-insensitive check)
      const [tables] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'commands'");
      
      // If table doesn't exist, create it
      if (tables.length === 0) {
        await queryInterface.createTable('commands', {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
          },
          device_id: {
            type: Sequelize.STRING,
            allowNull: false,
            references: {
              model: 'devices',
              key: 'device_id'  // Updated to reference the correct column in devices table
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: 'Reference to devices table (device_id)'
          },
          command: {
            type: Sequelize.STRING,
            allowNull: false
          },
          status: {
            type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'failed'),
            defaultValue: 'pending'
          },
          result: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          executed_at: {
            type: Sequelize.DATE,
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

      // If table exists, add any missing columns and indexes
      if (tables.length > 0) {
        const columns = await queryInterface.describeTable('commands');
        
        // Add status column if it doesn't exist
        if (!columns.status) {
          await queryInterface.addColumn('commands', 'status', {
            type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'failed'),
            defaultValue: 'pending',
            allowNull: false
          }, { transaction });
        }

        // Add result column if it doesn't exist
        if (!columns.result) {
          await queryInterface.addColumn('commands', 'result', {
            type: Sequelize.TEXT,
            allowNull: true
          }, { transaction });
        }

        // Get existing indexes
        const [indexes] = await queryInterface.sequelize.query(
          'SHOW INDEX FROM commands',
          { transaction }
        );
        const indexNames = [...new Set(indexes.map(idx => idx.Key_name))];
        
        // Add indexes if they don't exist
        const indexesToAdd = [
          { name: 'idx_commands_device_id', columns: ['device_id'] },
          { name: 'idx_commands_status', columns: ['status'] },
          { name: 'idx_commands_created_at', columns: ['createdAt'] }
        ];
        
        for (const idx of indexesToAdd) {
          if (!indexNames.includes(idx.name)) {
            await queryInterface.addIndex('commands', idx.columns, {
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
