'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Disable foreign key checks
      console.log('Disabling foreign key checks...');
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
      
      // 2. Drop the existing foreign key constraint if it exists
      console.log('Dropping existing foreign key constraints...');
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

      // 3. Modify the device_id column in call_recordings to be SIGNED to match devices.id
      console.log('Modifying call_recordings.device_id to be SIGNED...');
      await queryInterface.sequelize.query(
        `ALTER TABLE call_recordings 
         MODIFY COLUMN device_id INT NOT NULL COMMENT 'Reference to devices table (id)'`,
        { transaction }
      );

      // 4. Add the foreign key constraint back
      console.log('Adding foreign key constraint...');
      await queryInterface.sequelize.query(
        `ALTER TABLE call_recordings 
         ADD CONSTRAINT fk_call_recordings_device_id 
         FOREIGN KEY (device_id) REFERENCES devices(id) 
         ON DELETE CASCADE ON UPDATE CASCADE`,
        { transaction }
      );
      
      // 5. Re-enable foreign key checks
      console.log('Re-enabling foreign key checks...');
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
      
      await transaction.commit();
      console.log('✅ Successfully fixed device_id types and constraints');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error in migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // No down migration as this is a fix
    console.warn('⚠️  No down migration provided for this fix');
    return Promise.resolve();
  }
};
