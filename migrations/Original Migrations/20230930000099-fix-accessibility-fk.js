'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Step 1: Make sure deviceId has a unique constraint in the devices table
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
      
      // Add a unique constraint to device_id if it doesn't exist
      const [indexes] = await queryInterface.sequelize.query(
        `SHOW INDEX FROM devices WHERE Key_name = 'devices_device_id_unique'`,
        { transaction }
      );
      
      if (indexes.length === 0) {
        await queryInterface.addIndex('devices', ['device_id'], {
          name: 'devices_device_id_unique',
          unique: true,
          transaction
        });
      }
      
      // Step 2: Check if the foreign key exists and drop it
      const [results] = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME 
         FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
         WHERE TABLE_NAME = 'accessibility_data' 
         AND CONSTRAINT_NAME = 'accessibility_data_ibfk_1' 
         AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
        { transaction }
      );

      if (results.length > 0) {
        await queryInterface.sequelize.query(
          `ALTER TABLE accessibility_data 
           DROP FOREIGN KEY accessibility_data_ibfk_1`,
          { transaction }
        );
      }

      // Step 3: Ensure the column has the correct type
      await queryInterface.sequelize.query(
        `ALTER TABLE accessibility_data 
         MODIFY COLUMN device_id VARCHAR(255) NOT NULL`,
        { transaction }
      );
      
      // Step 4: Add the correct foreign key constraint if it doesn't exist
      const [constraints] = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME 
         FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
         WHERE TABLE_NAME = 'accessibility_data' 
         AND CONSTRAINT_NAME = 'fk_accessibility_data_device' 
         AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
        { transaction }
      );

      if (constraints.length === 0) {
        await queryInterface.addConstraint('accessibility_data', {
          fields: ['device_id'],
          type: 'foreign key',
          name: 'fk_accessibility_data_device',
          references: {
            table: 'devices',
            field: 'device_id'  // Reference the device_id column which is unique
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          transaction
        });
      }
      
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
      await transaction.commit();
      console.log('Successfully fixed accessibility_data foreign key constraints');
    } catch (error) {
      await transaction.rollback();
      console.error('Error fixing accessibility_data foreign key constraints:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
      
      // Remove the foreign key constraint
      await queryInterface.removeConstraint('accessibility_data', 'fk_accessibility_data_device', { transaction });
      
      // Change the column back to its original type if needed
      await queryInterface.changeColumn('accessibility_data', 'device_id', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      }, { transaction });
      
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error rolling back accessibility_data foreign key fix:', error);
      throw error;
    }
  }
};
