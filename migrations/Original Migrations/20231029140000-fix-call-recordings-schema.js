'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. First, drop all foreign key constraints on call_recordings
      const [constraints] = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME 
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
         WHERE TABLE_NAME = 'call_recordings' 
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

      // 2. Change the device_id column to match devices.id type
      await queryInterface.sequelize.query(
        `ALTER TABLE call_recordings 
         MODIFY COLUMN device_id INT UNSIGNED NOT NULL,
         ADD INDEX idx_call_recordings_device_id (device_id)`,
        { transaction }
      );

      // 3. Add back the foreign key constraint
      await queryInterface.sequelize.query(
        `ALTER TABLE call_recordings 
         ADD CONSTRAINT fk_call_recordings_device_id 
         FOREIGN KEY (device_id) REFERENCES devices(id) 
         ON DELETE CASCADE ON UPDATE CASCADE`,
        { transaction }
      );

      await transaction.commit();
      console.log('Successfully updated call_recordings schema');
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
