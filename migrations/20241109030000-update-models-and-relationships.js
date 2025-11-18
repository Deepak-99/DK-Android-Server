'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Update devices table to ensure proper structure
      const devicesTable = await queryInterface.describeTable('devices');
      
      if (!devicesTable.userId) {
        await queryInterface.addColumn('devices', 'userId', {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
          },
          after: 'deviceId'
        }, { transaction });
      }

      // Add status column if it doesn't exist
      if (!devicesTable.status) {
        await queryInterface.addColumn('devices', 'status', {
          type: Sequelize.ENUM('online', 'offline', 'active', 'inactive', 'suspended'),
          allowNull: false,
          defaultValue: 'offline'
        }, { transaction });
      }

      // 2. Ensure device_info has proper foreign key to devices.deviceId
      const deviceInfoTable = await queryInterface.describeTable('device_info');
      
      if (!deviceInfoTable.deviceId) {
        await queryInterface.addColumn('device_info', 'deviceId', {
          type: Sequelize.STRING,
          allowNull: false,
          references: {
            model: 'devices',
            key: 'deviceId',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          }
        }, { transaction });
      }

      // 3. Create or update app_updates table
      const appUpdatesTable = await queryInterface.describeTable('app_updates').catch(() => null);
      
      if (!appUpdatesTable) {
        await queryInterface.createTable('app_updates', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          versionName: {
            type: Sequelize.STRING,
            allowNull: false
          },
          versionCode: {
            type: Sequelize.INTEGER,
            allowNull: false
          },
          isCritical: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          filePath: {
            type: Sequelize.STRING,
            allowNull: true
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
          }
        }, { transaction });
      }

      // 4. Create or update app_installations table with proper relationships
      const appInstallationsTable = await queryInterface.describeTable('app_installations').catch(() => null);
      
      if (!appInstallationsTable) {
        await queryInterface.createTable('app_installations', {
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
              key: 'deviceId',
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE'
            }
          },
          packageName: {
            type: Sequelize.STRING,
            allowNull: false
          },
          versionName: {
            type: Sequelize.STRING,
            allowNull: false
          },
          versionCode: {
            type: Sequelize.INTEGER,
            allowNull: false
          },
          isSystemApp: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          metadata: {
            type: Sequelize.JSON,
            allowNull: true
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
          }
        }, { transaction });
      }

      // 5. Add indexes for better query performance
      const appInstallationsIndexes = await queryInterface.showIndex('app_installations');
      const hasAppInstallationsIndex = appInstallationsIndexes.some(idx => 
        idx.name === 'idx_app_installations_device_package'
      );
      
      if (!hasAppInstallationsIndex) {
        await queryInterface.addIndex('app_installations', ['deviceId', 'packageName'], {
          name: 'idx_app_installations_device_package',
          unique: true,
          transaction
        });
      }

      const deviceInfosIndexes = await queryInterface.showIndex('device_info');
      const hasDeviceInfosIndex = deviceInfosIndexes.some(idx => 
        idx.name === 'idx_device_info_device_id'
      );
      
      if (!hasDeviceInfosIndex) {
        await queryInterface.addIndex('device_info', ['deviceId'], {
          name: 'idx_device_info_device_id',
          unique: true,
          transaction
        });
      }

      await transaction.commit();
      console.log('Successfully updated models and relationships');
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating models and relationships:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove indexes
      await queryInterface.removeIndex('app_installations', 'idx_app_installations_device_package', { transaction });
      await queryInterface.removeIndex('device_info', 'idx_device_info_device_id', { transaction });
      
      // Remove columns and tables in reverse order
      await queryInterface.removeColumn('devices', 'userId', { transaction });
      
      await transaction.commit();
      console.log('Successfully rolled back model updates');
    } catch (error) {
      await transaction.rollback();
      console.error('Error rolling back model updates:', error);
      throw error;
    }
  }
};
