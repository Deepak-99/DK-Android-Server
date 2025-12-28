'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Get table info
      const tableInfo = await queryInterface.describeTable('devices');
      
      // 2. Add deviceId if it doesn't exist
      if (!tableInfo.deviceId) {
        await queryInterface.addColumn('devices', 'deviceId', {
          type: Sequelize.STRING,
          allowNull: true,
          unique: true,
          after: 'id'
        }, { transaction });

        // 3. If device_id exists, copy its data to deviceId
        if (tableInfo.device_id) {
          await queryInterface.sequelize.query(
            `UPDATE devices SET deviceId = device_id WHERE deviceId IS NULL`,
            { transaction }
          );
        }

        // 4. Make deviceId non-nullable after data migration
        await queryInterface.changeColumn('devices', 'deviceId', {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        }, { transaction });
      }

      // 5. Add nickname if it doesn't exist
      if (!tableInfo.nickname) {
        await queryInterface.addColumn('devices', 'nickname', {
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: 'User-defined nickname for the device',
          after: 'name'
        }, { transaction });
      }

      // 6. Add/Update indexes
      const indexes = await queryInterface.showIndex('devices');
      const hasDeviceIdIndex = indexes.some(index => 
        index.name === 'idx_devices_device_id' || 
        index.fields.some(field => field === 'deviceId' || field.name === 'deviceId')
      );
      
      if (!hasDeviceIdIndex) {
        await queryInterface.addIndex('devices', ['deviceId'], {
          name: 'idx_devices_device_id',
          unique: true,
          transaction
        });
      }

      // 7. Clean up old device_id column if it exists and is different from deviceId
      if (tableInfo.device_id && tableInfo.device_id !== tableInfo.deviceId) {
        // Check if device_id is used in any foreign keys
        const [results] = await queryInterface.sequelize.query(
          `SELECT * FROM information_schema.KEY_COLUMN_USAGE 
           WHERE REFERENCED_TABLE_SCHEMA = DATABASE() 
           AND REFERENCED_TABLE_NAME = 'devices' 
           AND REFERENCED_COLUMN_NAME = 'device_id'`,
          { transaction }
        );

        if (results.length === 0) {
          // No foreign key dependencies, safe to remove
          await queryInterface.removeColumn('devices', 'device_id', { transaction });
        } else {
          console.warn('Cannot remove device_id column: it is referenced by foreign keys');
        }
      }

      await transaction.commit();
      console.log('Consolidated device schema update completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Consolidated device schema update failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // This is a one-way migration - rolling back would be complex due to data migration
    console.warn('Rollback not supported for this migration');
    return Promise.resolve();
  }
};
