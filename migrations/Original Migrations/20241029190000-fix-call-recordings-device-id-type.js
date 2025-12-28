'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Add a new temporary column for the device_id as INTEGER
      console.log('Adding temporary device_id_new column...');
      await queryInterface.addColumn(
        'call_recordings',
        'device_id_new',
        {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true, // Temporarily allow nulls
          comment: 'Temporary column for device_id migration',
        },
        { transaction }
      );

      // 2. Copy and convert data from the old device_id to the new column
      console.log('Copying and converting device_id data...');
      await queryInterface.sequelize.query(
        `UPDATE call_recordings 
         SET device_id_new = CAST(device_id AS UNSIGNED) 
         WHERE device_id REGEXP '^[0-9]+$'`,
        { transaction }
      );

      // 3. Check if there are any non-numeric device_ids that couldn't be converted
      const [results] = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM call_recordings WHERE device_id_new IS NULL`,
        { transaction }
      );

      const nullCount = results[0].count;
      if (nullCount > 0) {
        console.warn(`⚠️  Warning: Found ${nullCount} records with non-numeric device_id that couldn't be automatically converted.`);
        console.warn('These records will have device_id_new set to NULL. Please update them manually.');
        
        // Log the problematic device_ids for reference
        const [problematic] = await queryInterface.sequelize.query(
          `SELECT DISTINCT device_id FROM call_recordings WHERE device_id_new IS NULL`,
          { transaction }
        );
        console.log('Problematic device_ids:', problematic.map(r => r.device_id));
      }

      // 4. Drop the old device_id column
      console.log('Dropping old device_id column...');
      await queryInterface.removeColumn('call_recordings', 'device_id', { transaction });

      // 5. Rename device_id_new to device_id
      console.log('Renaming device_id_new to device_id...');
      await queryInterface.renameColumn('call_recordings', 'device_id_new', 'device_id', { transaction });

      // 6. Make the column NOT NULL (now that we've converted all possible values)
      console.log('Setting device_id to NOT NULL...');
      await queryInterface.changeColumn(
        'call_recordings',
        'device_id',
        {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          comment: 'Reference to devices table (id)',
        },
        { transaction }
      );

      // 7. Add the foreign key constraint
      console.log('Adding foreign key constraint...');
      await queryInterface.addConstraint('call_recordings', {
        fields: ['device_id'],
        type: 'foreign key',
        name: 'fk_call_recordings_device_id',
        references: {
          table: 'devices',
          field: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        transaction,
      });

      // 8. Recreate the index
      console.log('Recreating index on device_id...');
      await queryInterface.addIndex('call_recordings', ['device_id'], {
        name: 'idx_call_recordings_device_id',
        transaction,
      });

      await transaction.commit();
      console.log('✅ Successfully fixed call_recordings.device_id column and constraints');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error in migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // This is a one-way migration - no down migration provided
    // as it would be destructive to the data
    console.warn('⚠️  No down migration provided for this data migration');
    return Promise.resolve();
  }
};
