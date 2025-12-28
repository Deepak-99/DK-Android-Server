'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Disable foreign key checks
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
      
      // 1. Fix call_recordings table
      await queryInterface.sequelize.query(
        `ALTER TABLE call_recordings 
         DROP FOREIGN KEY IF EXISTS call_recordings_ibfk_5,
         DROP FOREIGN KEY IF EXISTS fk_call_recordings_device_id,
         MODIFY COLUMN device_id INT UNSIGNED NOT NULL,
         ADD CONSTRAINT fk_call_recordings_device_id 
         FOREIGN KEY (device_id) REFERENCES devices(id) 
         ON DELETE CASCADE ON UPDATE CASCADE`,
        { transaction }
      );

      // 2. Fix contacts table
      await queryInterface.sequelize.query(
        `ALTER TABLE contacts 
         DROP FOREIGN KEY IF EXISTS contacts_ibfk_2,
         MODIFY COLUMN device_id INT UNSIGNED NOT NULL,
         ADD CONSTRAINT fk_contacts_device_id 
         FOREIGN KEY (device_id) REFERENCES devices(id) 
         ON DELETE CASCADE ON UPDATE CASCADE`,
        { transaction }
      );

      // Re-enable foreign key checks
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
      
      await transaction.commit();
      console.log('Successfully fixed foreign key constraints');
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
