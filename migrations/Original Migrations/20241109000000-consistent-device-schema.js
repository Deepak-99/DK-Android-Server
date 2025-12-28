'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Create devices table with consistent deviceId
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
          field: 'deviceId',
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
          field: 'osVersion',
          allowNull: true
        },
        isOnline: {
          type: Sequelize.BOOLEAN,
          field: 'isOnline',
          allowNull: false,
          defaultValue: false
        },
        lastSeen: {
          type: Sequelize.DATE,
          field: 'lastSeen',
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

      // Create device_infos table with consistent deviceId reference
      await queryInterface.createTable('device_infos', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        deviceId: {
          type: Sequelize.STRING,
          allowNull: false,
          field: 'deviceId',
          references: {
            model: 'devices',
            key: 'deviceId'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        hardwareInfo: {
          type: Sequelize.JSON,
          field: 'hardwareInfo',
          allowNull: true
        },
        softwareInfo: {
          type: Sequelize.JSON,
          field: 'softwareInfo',
          allowNull: true
        },
        networkInfo: {
          type: Sequelize.JSON,
          field: 'networkInfo',
          allowNull: true
        },
        securityInfo: {
          type: Sequelize.JSON,
          field: 'securityInfo',
          allowNull: true
        },
        installedApps: {
          type: Sequelize.JSON,
          field: 'installedApps',
          allowNull: true
        },
        systemSettings: {
          type: Sequelize.JSON,
          field: 'systemSettings',
          allowNull: true
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

      // Create commands table with consistent deviceId reference
      await queryInterface.createTable('commands', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        deviceId: {
          type: Sequelize.STRING,
          allowNull: false,
          field: 'deviceId',
          references: {
            model: 'devices',
            key: 'deviceId'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        commandType: {
          type: Sequelize.STRING,
          field: 'commandType',
          allowNull: false
        },
        status: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'pending'
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
          field: 'executedAt',
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

      // Add indexes for better query performance
      await queryInterface.addIndex('devices', ['deviceId'], {
        name: 'idx_devices_deviceId',
        unique: true,
        transaction
      });

      await queryInterface.addIndex('device_infos', ['deviceId'], {
        name: 'idx_device_infos_deviceId',
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
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
