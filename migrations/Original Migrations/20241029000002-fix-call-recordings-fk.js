'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // First, drop the existing foreign key constraint if it exists
      const [results] = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME 
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
         WHERE TABLE_NAME = 'call_recordings' 
         AND COLUMN_NAME = 'device_id'
         AND REFERENCED_TABLE_NAME = 'devices'`,
        { transaction }
      );

      if (results && results.length > 0) {
        const constraintName = results[0].CONSTRAINT_NAME;
        await queryInterface.sequelize.query(
          `ALTER TABLE call_recordings DROP FOREIGN KEY ${constraintName}`,
          { transaction }
        );
      }

      // Now, add the correct foreign key constraint
      await queryInterface.addConstraint('call_recordings', {
        fields: ['device_id'],
        type: 'foreign key',
        name: 'call_recordings_device_id_fk',
        references: {
          table: 'devices',
          field: 'device_id'  // Reference the device_id column which is a STRING
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        transaction
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // No need to implement down migration as this is a fix
    // If needed, you can implement the reverse operation
  }
};
