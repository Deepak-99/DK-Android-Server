'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // First, remove the foreign key constraint if it exists
      const [results] = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME 
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
         WHERE TABLE_NAME = 'call_recordings' 
         AND COLUMN_NAME = 'device_id' 
         AND REFERENCED_TABLE_NAME IS NOT NULL`,
        { transaction }
      );

      if (results.length > 0) {
        const fkName = results[0].CONSTRAINT_NAME;
        await queryInterface.sequelize.query(
          `ALTER TABLE call_recordings DROP FOREIGN KEY ${fkName}`,
          { transaction }
        );
        console.log(`Dropped foreign key constraint: ${fkName}`);
      }

      // Change the column type to match the devices.id type
      await queryInterface.changeColumn(
        'call_recordings',
        'device_id',
        {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          references: {
            model: 'devices',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        { transaction }
      );

      // Add back the index
      await queryInterface.addIndex('call_recordings', ['device_id'], {
        name: 'idx_call_recordings_device_id',
        transaction
      });

      await transaction.commit();
      console.log('Successfully updated call_recordings.device_id column');
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
