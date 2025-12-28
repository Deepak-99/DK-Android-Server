'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, check if the status column exists
    const [results] = await queryInterface.sequelize.query(
      `SHOW COLUMNS FROM call_recordings LIKE 'status'`
    );

    // If status column doesn't exist, add it
    if (results.length === 0) {
      await queryInterface.addColumn('call_recordings', 'status', {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'),
        defaultValue: 'pending',
        allowNull: false
      });
      console.log('Added status column to call_recordings table');
    } else {
      console.log('status column already exists in call_recordings table');
    }

    // Now add the index
    await queryInterface.addIndex('call_recordings', ['status'], {
      name: 'idx_call_recordings_status'
    });
    console.log('Added index on status column in call_recordings table');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the index first
    await queryInterface.removeIndex('call_recordings', 'idx_call_recordings_status');
    
    // Optionally remove the column (commented out for safety)
    // await queryInterface.removeColumn('call_recordings', 'status');
  }
};
