'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    // Helper function to safely drop a foreign key
    const dropForeignKeyIfExists = async (tableName, constraintName) => {
      const [constraints] = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME 
         FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
         WHERE TABLE_NAME = '${tableName}' 
         AND CONSTRAINT_NAME = '${constraintName}'
         AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
        { transaction }
      );
      
      if (constraints.length > 0) {
        await queryInterface.sequelize.query(
          `ALTER TABLE ${tableName} DROP FOREIGN KEY ${constraintName}`,
          { transaction }
        );
        console.log(`Dropped foreign key ${constraintName} from ${tableName}`);
      } else {
        console.log(`Foreign key ${constraintName} does not exist in ${tableName}, skipping...`);
      }
    };
    
    try {
      // Drop existing foreign key constraints that are causing issues
      await dropForeignKeyIfExists('call_recordings', 'call_recordings_device_id_fk');
      await dropForeignKeyIfExists('device_infos', 'fk_device_infos_device_id');
      await dropForeignKeyIfExists('file_uploads', 'fk_file_uploads_device_id');
      
      // Modify the call_recordings table to reference devices.device_id
      await queryInterface.changeColumn('call_recordings', 'device_id', {
        type: Sequelize.STRING(255),
        allowNull: false
      }, { transaction });
      
      // Check if foreign key constraint already exists
      const [constraints] = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME 
         FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
         WHERE TABLE_NAME = 'call_recordings' 
         AND CONSTRAINT_NAME = 'fk_call_recordings_device' 
         AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
        { transaction }
      );

      if (constraints.length === 0) {
        // Add the foreign key constraint if it doesn't exist
        await queryInterface.addConstraint('call_recordings', {
          fields: ['device_id'],
          type: 'foreign key',
          name: 'fk_call_recordings_device',
          references: {
            table: 'devices',
            field: 'device_id'  // Reference device_id in devices table
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          transaction
        });
        console.log('Added foreign key fk_call_recordings_device');
      } else {
        console.log('Foreign key fk_call_recordings_device already exists, skipping...');
      }
      
      // Check if index exists before creating it
      const [indexes] = await queryInterface.sequelize.query(
        `SHOW INDEX FROM call_recordings WHERE Key_name = 'idx_call_recordings_device_id'`,
        { transaction }
      );
      
      if (indexes.length === 0) {
        // Add an index for better performance if it doesn't exist
        await queryInterface.addIndex('call_recordings', ['device_id'], {
          name: 'idx_call_recordings_device_id',
          transaction
        });
        console.log('Added index idx_call_recordings_device_id');
      } else {
        console.log('Index idx_call_recordings_device_id already exists, skipping...');
      }
      
      await transaction.commit();
      console.log('Successfully fixed foreign key constraints');
    } catch (error) {
      await transaction.rollback();
      console.error('Error fixing foreign key constraints:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // This is a one-way migration, so we don't provide a down migration
    // to prevent data loss
  }
};
