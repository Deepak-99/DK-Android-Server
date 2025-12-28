'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if the column exists and has the correct definition
      const [results] = await queryInterface.sequelize.query(
        `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA, COLUMN_COMMENT 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_NAME = 'app_installations' 
         AND COLUMN_NAME = 'app_update_id'`,
        { transaction }
      );

      if (results.length === 0) {
        // Column doesn't exist, add it
        await queryInterface.addColumn(
          'app_installations',
          'app_update_id',
          {
            type: Sequelize.UUID,
            allowNull: true,
            comment: 'Reference to app_updates table',
            references: { 
              model: 'app_updates', 
              key: 'id',
              onDelete: 'SET NULL',
              onUpdate: 'CASCADE'
            }
          },
          { transaction }
        );
        console.log('Added app_update_id column to app_installations table');
      } else {
        console.log('app_update_id column already exists in app_installations table');
      }

      await transaction.commit();
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
