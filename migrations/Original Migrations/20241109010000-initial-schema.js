'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Create users table
      await queryInterface.createTable('users', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
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
          validate: {
            isEmail: true
          }
        },
        password: {
          type: Sequelize.STRING,
          allowNull: false
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false
        },
        lastLogin: {
          type: Sequelize.DATE,
          allowNull: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // Create devices table
      await queryInterface.createTable('devices', {
        id: {
          type: Sequelize.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        deviceId: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
          comment: 'Unique device identifier from Android'
        },
        name: {
          type: Sequelize.STRING,
          allowNull: true
        },
        nickname: {
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: 'User-defined nickname for the device'
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
          defaultValue: false,
          allowNull: false
        },
        lastSeen: {
          type: Sequelize.DATE,
          allowNull: true
        },
        imei: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Device IMEI number'
        },
        userId: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // Create device_infos table
      await queryInterface.createTable('device_infos', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        deviceId: {
          type: Sequelize.STRING,
          allowNull: false,
          references: {
            model: 'devices',
            key: 'deviceId'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        hardwareInfo: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Hardware specifications'
        },
        softwareInfo: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Software and OS information'
        },
        networkInfo: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Network configuration and status'
        },
        securityInfo: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Security settings and status'
        },
        installedApps: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'List of installed applications'
        },
        systemSettings: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'System settings and configurations'
        },
        permissions: {
          type: Sequelize.JSON,
          allowNull: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // Create commands table
      await queryInterface.createTable('commands', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        deviceId: {
          type: Sequelize.STRING,
          allowNull: false,
          references: {
            model: 'devices',
            key: 'deviceId'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        commandType: {
          type: Sequelize.STRING,
          allowNull: false
        },
        status: {
          type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'failed'),
          defaultValue: 'pending',
          allowNull: false
        },
        payload: {
          type: Sequelize.JSON,
          allowNull: true
        },
        response: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        executedAt: {
          type: Sequelize.DATE,
          allowNull: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // Create indexes
      await queryInterface.addIndex('devices', ['deviceId'], {
        name: 'idx_devices_deviceId',
        unique: true,
        transaction
      });

      await queryInterface.addIndex('devices', ['userId'], {
        name: 'idx_devices_userId',
        transaction
      });

      await queryInterface.addIndex('devices', ['imei'], {
        name: 'idx_devices_imei',
        transaction
      });

      await queryInterface.addIndex('device_infos', ['deviceId'], {
        name: 'idx_device_infos_deviceId',
        unique: true,
        transaction
      });

      await queryInterface.addIndex('commands', ['deviceId'], {
        name: 'idx_commands_deviceId',
        transaction
      });

      await queryInterface.addIndex('commands', ['status'], {
        name: 'idx_commands_status',
        transaction
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Drop tables in reverse order to respect foreign key constraints
      await queryInterface.dropTable('commands', { transaction });
      await queryInterface.dropTable('device_infos', { transaction });
      await queryInterface.dropTable('devices', { transaction });
      await queryInterface.dropTable('users', { transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
