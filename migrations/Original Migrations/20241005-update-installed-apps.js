'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, drop the foreign key constraint if it exists
    try {
      await queryInterface.removeConstraint('installed_apps', 'installed_apps_ibfk_1');
      await queryInterface.removeConstraint('installed_apps', 'installed_apps_ibfk_2');
    } catch (error) {
      console.log('No existing foreign key constraints to remove');
    }

    // Get all indexes except primary key
    const [results] = await queryInterface.sequelize.query(
      "SHOW INDEX FROM installed_apps WHERE Key_name != 'PRIMARY'"
    );
    
    // Group indexes by name to handle multi-column indexes
    const indexesToDrop = [...new Set(results.map(index => index.Key_name))];
    
    // Drop each index if it exists
    for (const indexName of indexesToDrop) {
      try {
        await queryInterface.removeIndex('installed_apps', indexName);
        console.log(`Dropped index: ${indexName}`);
      } catch (error) {
        if (error.original && error.original.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
          console.log(`Index ${indexName} does not exist, skipping...`);
        } else {
          throw error;
        }
      }
    }

    // Modify the device_id column to reference devices.device_id
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // First, remove any existing foreign key constraints
      try {
        await queryInterface.removeConstraint('installed_apps', 'installed_apps_ibfk_1', { transaction });
      } catch (error) {
        // Ignore if constraint doesn't exist
      }

      // Then modify the column
      await queryInterface.changeColumn('installed_apps', 'device_id', {
        type: Sequelize.STRING,
        allowNull: false
      }, { transaction });

      // Add the foreign key constraint separately
      await queryInterface.addConstraint('installed_apps', {
        fields: ['device_id'],
        type: 'foreign key',
        name: 'installed_apps_ibfk_1',
        references: {
          table: 'devices',
          field: 'device_id'  // Changed from 'deviceId' to 'device_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        transaction
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error in migration:', error);
      throw error;
    }

    // Create new indexes
    await queryInterface.addIndex('installed_apps', ['device_id'], {
      name: 'idx_installed_apps_device'
    });

    await queryInterface.addIndex('installed_apps', ['package_name'], {
      name: 'idx_installed_apps_package'
    });

    await queryInterface.addIndex('installed_apps', ['is_system_app'], {
      name: 'idx_installed_apps_system'
    });

    await queryInterface.addIndex('installed_apps', ['is_enabled'], {
      name: 'idx_installed_apps_enabled'
    });

    await queryInterface.addIndex('installed_apps', ['sync_timestamp'], {
      name: 'idx_installed_apps_sync_timestamp'
    });

    // Create composite unique index
    await queryInterface.addIndex('installed_apps', ['device_id', 'package_name'], {
      name: 'idx_installed_apps_device_package',
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    const indexesToRemove = [
      'idx_installed_apps_device',
      'idx_installed_apps_package',
      'idx_installed_apps_system',
      'idx_installed_apps_enabled',
      'idx_installed_apps_sync_timestamp',
      'idx_installed_apps_device_package'
    ];

    // Safely remove indexes if they exist
    for (const indexName of indexesToRemove) {
      try {
        await queryInterface.removeIndex('installed_apps', indexName);
      } catch (error) {
        if (error.original && error.original.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
          console.log(`Index ${indexName} does not exist, skipping...`);
        } else {
          throw error;
        }
      }
    }
    
    // Revert the device_id column type if needed
    try {
      await queryInterface.changeColumn('installed_apps', 'device_id', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      });
    } catch (error) {
      console.error('Error reverting device_id column type:', error);
      throw error;
    }
  }
};
