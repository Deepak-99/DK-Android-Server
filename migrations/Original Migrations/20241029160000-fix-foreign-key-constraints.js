'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Disable foreign key checks
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
      
      // 1. First, drop existing foreign key constraints if they exist
      const [constraints] = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME 
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
         WHERE TABLE_NAME = 'call_recordings' 
         AND CONSTRAINT_NAME = 'call_recordings_ibfk_5'`,
        { transaction }
      );

      if (constraints.length > 0) {
        await queryInterface.sequelize.query(
          `ALTER TABLE call_recordings DROP FOREIGN KEY call_recordings_ibfk_5`,
          { transaction }
        );
        console.log('Dropped foreign key constraint: call_recordings_ibfk_5');
      }

      // 2. Modify the device_id column to match the devices.id type
      await queryInterface.sequelize.query(
        `ALTER TABLE call_recordings 
         MODIFY COLUMN device_id INT UNSIGNED NOT NULL`,
        { transaction }
      );

      // 3. Add the foreign key constraint
      await queryInterface.sequelize.query(
        `ALTER TABLE call_recordings 
         ADD CONSTRAINT fk_call_recordings_device_id 
         FOREIGN KEY (device_id) REFERENCES devices(id) 
         ON DELETE CASCADE ON UPDATE CASCADE`,
        { transaction }
      );

      // Re-enable foreign key checks
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
      
      await transaction.commit();
      console.log('Successfully fixed foreign key constraints for call_recordings');
    } catch (error) {
      await transaction.rollback();
      console.error('Error in migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // No need to implement down for this migration
    return Promise.resolve();
  }
};
