'use strict';

/**
 * Migration to create and update the AppInstallations table.
 * Tracks application installations on devices with versioning and status information.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableName = 'app_installations';
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if table exists (case-insensitive check)
      const [tables] = await queryInterface.sequelize.query(
        `SHOW TABLES LIKE '${tableName}'`,
        { transaction }
      );
      const tableExists = tables.length > 0;

      // Define table columns with comments and validations
      const columns = {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Primary key for the app installation record'
        },
        device_id: {
          type: Sequelize.STRING,
          allowNull: false,
          field: 'device_id',  // Maps to device_id column in the database
          comment: 'Reference to the device where the app is installed',
          references: {
            model: 'devices',
            key: 'device_id'   // Reference to the device_id column in devices table
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        package_name: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'Package name of the installed application'
        },
        app_name: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'Display name of the installed application'
        },
        version_name: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Version name of the installed application (e.g., 1.0.0)'
        },
        version_code: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Version code of the installed application (for version comparison)'
        },
        install_time: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When the application was installed on the device'
        },
        update_time: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When the application was last updated on the device'
        },
        is_system_app: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Whether this is a system app (true) or user-installed app (false)'
        },
        is_enabled: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          comment: 'Whether the app is currently enabled on the device'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'When this record was created'
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'When this record was last updated'
        }
      };

      // Create table if it doesn't exist
      if (!tableExists) {
        console.log(`Creating ${tableName} table...`);
        await queryInterface.createTable(tableName, columns, { transaction });
        console.log(`${tableName} table created`);
      } else {
        console.log(`${tableName} table already exists, checking for required columns...`);
        const existingColumns = await queryInterface.describeTable(tableName, { transaction });
        
        // Add any missing columns
        for (const [columnName, columnDefinition] of Object.entries(columns)) {
          if (!existingColumns[columnName]) {
            console.log(`Adding column ${columnName} to ${tableName}...`);
            await queryInterface.addColumn(
              tableName, 
              columnName, 
              { ...columnDefinition, comment: undefined }, // Remove comment for addColumn
              { transaction }
            );
          }
        }
      }

      // Define indexes
      const indexes = [
        {
          name: 'idx_app_installations_device_id',
          fields: ['device_id']
        },
        {
          name: 'idx_app_installations_package_name',
          fields: ['package_name']
        },
        {
          name: 'idx_app_installations_system_status',
          fields: ['is_system_app']
        },
        {
          name: 'idx_app_installations_enabled_status',
          fields: ['is_enabled']
        },
        {
          name: 'idx_app_installations_created_at',
          fields: ['created_at']
        }
      ];

      // Get existing indexes and foreign keys
      const existingIndexes = await queryInterface.showIndex(tableName, { transaction });
      const [foreignKeys] = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = '${tableName}'
         AND REFERENCED_TABLE_NAME IS NOT NULL`,
        { transaction }
      );
      
      // Find indexes that are used by foreign keys
      const fkIndexes = new Set();
      for (const fk of foreignKeys) {
        const index = existingIndexes.find(idx => 
          idx.columnName === fk.COLUMN_NAME && 
          !idx.primary && 
          !idx.unique
        );
        if (index) {
          fkIndexes.add(index.name);
        }
      }
      
      // Remove any existing indexes that we want to replace and aren't used by FKs
      for (const index of existingIndexes) {
        // Skip primary key, unique constraints, and foreign key indexes
        if (index.primary || index.unique || fkIndexes.has(index.name)) {
          console.log(`Skipping index ${index.name} (${index.primary ? 'primary' : index.unique ? 'unique' : 'used by FK'})`);
          continue;
        }
        
        // Skip the deviceId index as it's used by a foreign key
        if (index.name === 'deviceId') {
          console.log('Skipping deviceId index as it is used by a foreign key');
          continue;
        }
        
        // Remove index if it's not in our defined indexes
        const shouldKeep = indexes.some(
          idx => idx.name === index.name || 
                 (idx.fields.length === 1 && 
                  index.fields.some(field => idx.fields.includes(field.name || field.attribute)))
        );
        
        if (!shouldKeep) {
          try {
            console.log(`Removing obsolete index ${index.name}...`);
            await queryInterface.removeIndex(tableName, index.name, { transaction });
          } catch (error) {
            console.warn(`Warning: Could not remove index ${index.name}:`, error.message);
            // Continue with the migration even if we can't remove the index
          }
        }
      }

      // Add new indexes
      for (const index of indexes) {
        const indexExists = existingIndexes.some(
          idx => idx.name === index.name || 
                 (idx.fields.length === index.fields.length && 
                  index.fields.every((field, i) => 
                    (idx.fields[i].name || idx.fields[i].attribute) === field))
        );
        
        if (!indexExists) {
          console.log(`Adding index ${index.name}...`);
          await queryInterface.addIndex(
            tableName, 
            index.fields, 
            { name: index.name, transaction }
          );
        }
      }

      // Add unique constraint on device_id and package_name if it doesn't exist
      const hasUniqueConstraint = existingIndexes.some(index => 
        (index.unique === true || index.unique === 1) && 
        index.fields.length === 2 &&
        index.fields.some(field => (field.name || field.attribute) === 'device_id') &&
        index.fields.some(field => (field.name || field.attribute) === 'package_name')
      );

      // Also check for constraint by name in case the index check doesn't catch it
      const [constraints] = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME 
         FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
         WHERE TABLE_NAME = '${tableName}' 
         AND CONSTRAINT_TYPE = 'UNIQUE' 
         AND CONSTRAINT_NAME = 'unique_app_installation'`,
        { transaction }
      );

      if (!hasUniqueConstraint && constraints.length === 0) {
        console.log('Adding unique constraint on device_id and package_name...');
        await queryInterface.addConstraint(tableName, {
          fields: ['device_id', 'package_name'],
          type: 'unique',
          name: 'unique_app_installation',
          transaction
        });
      } else {
        console.log('Unique constraint on device_id and package_name already exists, skipping...');
      }

      await transaction.commit();
      console.log(`${tableName} migration completed successfully`);
    } catch (error) {
      console.error(`Error in ${tableName} migration:`, error);
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableName = 'app_installations';
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if table exists
      const tableExists = await queryInterface.showAllTables().then(tables => 
        tables.some(table => table.tableName === tableName.toLowerCase())
      );

      if (!tableExists) {
        console.log(`${tableName} table does not exist, nothing to rollback`);
        return;
      }

      // Get all foreign key constraints
      const foreignKeys = await queryInterface.getForeignKeyReferencesForTable(tableName, { transaction });
      
      // Remove all foreign key constraints first
      for (const fk of foreignKeys) {
        console.log(`Removing foreign key constraint: ${fk.constraintName}`);
        await queryInterface.removeConstraint(tableName, fk.constraintName, { transaction });
      }

      // Get all indexes
      const indexes = await queryInterface.showIndex(tableName, { transaction });
      
      // Remove all indexes except primary key
      for (const index of indexes) {
        if (!index.primary) {
          console.log(`Removing index: ${index.name}`);
          await queryInterface.removeIndex(tableName, index.name, { transaction });
        }
      }

      // Drop the table
      console.log(`Dropping table ${tableName}...`);
      await queryInterface.dropTable(tableName, { transaction });
      
      await transaction.commit();
      console.log(`${tableName} rollback completed successfully`);
    } catch (error) {
      console.error(`Error rolling back ${tableName} migration:`, error);
      await transaction.rollback();
      throw error;
    }
  }
};
