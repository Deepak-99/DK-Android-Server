'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Disable foreign key checks
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
      
      // Check if tables exist
      const [tables] = await queryInterface.sequelize.query("SHOW TABLES");
      const tableNames = tables.map(t => Object.values(t)[0]);
      
      // Create users table if it doesn't exist
      if (!tableNames.some(t => t.toLowerCase() === 'users')) {
        await queryInterface.createTable('users', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          username: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
          },
          email: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
            validate: { isEmail: true }
          },
          password: {
            type: Sequelize.STRING,
            allowNull: false
          },
          role: {
            type: Sequelize.ENUM('admin', 'user'),
            defaultValue: 'user'
          },
          isActive: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
          },
          lastLogin: {
            type: Sequelize.DATE,
            allowNull: true
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          }
        }, { transaction });
        
        // Add indexes
        await queryInterface.addIndex('users', ['username'], {
          name: 'idx_users_username',
          unique: true,
          transaction
        });
        
        await queryInterface.addIndex('users', ['email'], {
          name: 'idx_users_email',
          unique: true,
          transaction
        });
        
        console.log('Created users table');
      }
      
      // Create devices table if it doesn't exist
      if (!tableNames.some(t => t.toLowerCase() === 'devices')) {
        await queryInterface.createTable('devices', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          deviceId: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
          },
          name: {
            type: Sequelize.STRING,
            allowNull: true
          },
          model: {
            type: Sequelize.STRING,
            allowNull: true
          },
          manufacturer: {
            type: Sequelize.STRING,
            allowNull: true
          },
          os: {
            type: Sequelize.STRING,
            allowNull: true
          },
          osVersion: {
            type: Sequelize.STRING,
            allowNull: true
          },
          isOnline: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          lastSeen: {
            type: Sequelize.DATE,
            allowNull: true
          },
          ipAddress: {
            type: Sequelize.STRING,
            allowNull: true
          },
          macAddress: {
            type: Sequelize.STRING,
            allowNull: true
          },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'users',  // Changed from 'Users' to 'users'
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          settings: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          status: {
            type: Sequelize.ENUM('active', 'inactive', 'suspended'),
            defaultValue: 'active'
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          }
        }, { transaction });
        
        // Add indexes
        await queryInterface.addIndex('devices', ['deviceId'], {
          name: 'idx_devices_device_id',
          transaction
        });
        
        await queryInterface.addIndex('devices', ['userId'], {
          name: 'idx_devices_user_id',
          transaction
        });
        
        console.log('Created devices table');
      }
      
      // Re-enable foreign key checks
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
      
      await transaction.commit();
      console.log('Migration completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Disable foreign key checks
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
      
      // Drop tables in reverse order
      await queryInterface.dropTable('devices', { transaction });
      await queryInterface.dropTable('users', { transaction });
      
      // Re-enable foreign key checks
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
