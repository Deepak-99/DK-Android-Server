'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if the constraint exists before trying to remove it
      const [constraints] = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME 
         FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
         WHERE TABLE_NAME = 'call_recordings' 
         AND CONSTRAINT_NAME = 'call_recordings_device_id_fk' 
         AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
        { transaction }
      );

      if (constraints.length > 0) {
        await queryInterface.removeConstraint('call_recordings', 'call_recordings_device_id_fk', { transaction });
      }

      // Modify the device_id column to match the devices.device_id type
      await queryInterface.changeColumn('call_recordings', 'device_id', {
        type: Sequelize.STRING,
        allowNull: false
      }, { transaction });

      // Add the foreign key constraint with the correct reference
      await queryInterface.addConstraint('call_recordings', {
        fields: ['device_id'],
        type: 'foreign key',
        name: 'call_recordings_device_id_fk',
        references: {
          table: 'devices',
          field: 'device_id'  // Reference to device_id in devices table
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        transaction
      });
      
      await transaction.commit();
      console.log('Successfully updated call_recordings foreign key');
    } catch (error) {
      await transaction.rollback();
      console.error('Error in migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if the constraint exists before trying to remove it
      const [constraints] = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME 
         FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
         WHERE TABLE_NAME = 'call_recordings' 
         AND CONSTRAINT_NAME = 'call_recordings_device_id_fk' 
         AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
        { transaction }
      );

      if (constraints.length > 0) {
        await queryInterface.removeConstraint('call_recordings', 'call_recordings_device_id_fk', { transaction });
      }
      
      // Revert to the original column definition if needed
      await queryInterface.changeColumn('call_recordings', 'device_id', {
        type: Sequelize.STRING,
        allowNull: false
      }, { transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error in migration rollback:', error);
      throw error;
    }
  }
};
