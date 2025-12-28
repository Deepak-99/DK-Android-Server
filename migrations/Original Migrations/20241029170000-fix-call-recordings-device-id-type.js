'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Drop any existing foreign key constraints on device_id
      const [constraints] = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME 
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
         WHERE TABLE_NAME = 'call_recordings' 
         AND COLUMN_NAME = 'device_id' 
         AND REFERENCED_TABLE_NAME IS NOT NULL`,
        { transaction }
      );

      for (const constraint of constraints) {
        await queryInterface.sequelize.query(
          `ALTER TABLE call_recordings DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}`,
          { transaction }
        );
        console.log(`Dropped foreign key constraint: ${constraint.CONSTRAINT_NAME}`);
      }

      // 2. Change the column type from VARCHAR to INT UNSIGNED
      await queryInterface.sequelize.query(
        `ALTER TABLE call_recordings 
         MODIFY COLUMN device_id INT UNSIGNED NOT NULL COMMENT 'Reference to devices table (id)'`,
        { transaction }
      );

      // 3. Add a new foreign key constraint
      await queryInterface.sequelize.query(
        `ALTER TABLE call_recordings 
         ADD CONSTRAINT fk_call_recordings_device_id 
         FOREIGN KEY (device_id) REFERENCES devices(id) 
         ON DELETE CASCADE ON UPDATE CASCADE`,
        { transaction }
      );
      
      await transaction.commit();
      console.log('Successfully fixed device_id column type and constraints in call_recordings table');
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
