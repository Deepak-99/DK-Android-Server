'use strict';

/**
 * Migration to create and update the DynamicConfigs table.
 * Handles configuration key-value storage with versioning and access control.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'dynamic_configs';
    
    try {
      console.log(`Starting migration for ${tableName}...`);
      
      // Check if table exists
      const tables = await queryInterface.showAllTables();
      const tableExists = tables.some(t => t.toLowerCase() === tableName.toLowerCase());
      
      if (!tableExists) {
        console.log(`Creating ${tableName} table...`);
        await queryInterface.createTable(tableName, {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
          },
          key: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
          },
          value: {
            type: Sequelize.JSON,
            allowNull: false,
            comment: 'Configuration value in JSON format'
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          is_public: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            field: 'isPublic',
            comment: 'Whether this configuration is publicly accessible'
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
          }
        });
      }

      console.log(`Updating ${tableName} table...`);
      
      // Get current columns
      const columns = await queryInterface.describeTable(tableName, { transaction });
      
      // Define all columns to add
      const columnsToAdd = [
        {
          name: 'description',
          options: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Description of the configuration value'
          }
        },
        {
          name: 'is_public',
          options: {
            type: Sequelize.BOOLEAN,
            field: 'isPublic',
            allowNull: false,
            defaultValue: false,
            comment: 'Whether this configuration is publicly accessible'
          }
        },
        {
          name: 'version',
          options: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 1,
            comment: 'Version number for optimistic locking'
          }
        },
        {
          name: 'metadata',
          options: {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'Additional metadata for the configuration'
          }
        }
      ];
      
      // Add missing columns
      for (const { name, options } of columnsToAdd) {
        if (!columns[name]) {
          console.log(`Adding column ${name}...`);
          await queryInterface.addColumn(tableName, name, options, { transaction });
        }
      }

      // Update existing columns if needed
      const columnsToUpdate = [
        {
          name: 'value',
          options: {
            type: Sequelize.JSONB,
            allowNull: false,
            comment: 'Configuration value (JSON format)'
          }
        },
        {
          name: 'key',
          options: {
            type: Sequelize.STRING(255),
            allowNull: false,
            comment: 'Unique configuration key'
          }
        }
      ];
      
      // Note: In some databases, we might need to drop and recreate columns to modify them
      // For safety, we'll just log the need for manual intervention
      for (const { name, options } of columnsToUpdate) {
        if (columns[name] && columns[name].type !== options.type) {
          console.warn(`Column ${name} needs type update from ${columns[name].type} to ${options.type}. Manual migration may be required.`);
        }
      }

      // Define all required indexes
      const indexConfigs = [
        {
          name: 'idx_dynamic_configs_key',
          fields: ['key'],
          unique: true
        },
        {
          name: 'idx_dynamic_configs_is_public',
          fields: ['is_public'],
          unique: false
        },
        {
          name: 'idx_dynamic_configs_created_at',
          fields: ['createdAt'],
          unique: false
        }
      ];
      
      // Get existing indexes
      const indexes = await queryInterface.showIndex(tableName, { transaction });
      const indexNames = indexes.map(idx => idx.name);
      
      // Add or update indexes
      for (const index of indexConfigs) {
        if (!indexNames.includes(index.name)) {
          console.log(`Creating index ${index.name}...`);
          await queryInterface.addIndex(tableName, index.fields, {
            name: index.name,
            unique: index.unique || false,
            transaction
          });
        }
      }

      // Remove any obsolete indexes
      const validIndexNames = indexConfigs.map(idx => idx.name);
      for (const index of indexes) {
        if (!validIndexNames.includes(index.name) && !index.primary) {
          console.log(`Removing obsolete index ${index.name}...`);
          try {
            await queryInterface.removeIndex(tableName, index.name, { transaction });
          } catch (error) {
            console.error(`Failed to remove index ${index.name}:`, error.message);
          }
        }
      }

      await transaction.commit();
      console.log(`${tableName} migration completed successfully`);
    } catch (error) {
      await transaction.rollback();
      console.error(`${tableName} migration failed:`, error);
      throw new Error(`Failed to migrate ${tableName}: ${error.message}`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'dynamic_configs';
    
    try {
      console.log(`Starting rollback for ${tableName}...`);
      
      // Check if table exists
      const tables = await queryInterface.showAllTables();
      if (!tables.includes(tableName)) {
        console.log(`Table ${tableName} does not exist, nothing to rollback`);
        await transaction.commit();
        return;
      }
      
      // Get current columns
      const columns = await queryInterface.describeTable(tableName, { transaction });
      
      // Columns to remove (added in this migration)
      const columnsToRemove = [
        'description',
        'is_public',
        'version',
        'metadata'
      ];
      
      // Remove added columns
      for (const column of columnsToRemove) {
        if (columns[column]) {
          console.log(`Removing column ${column}...`);
          try {
            await queryInterface.removeColumn(tableName, column, { transaction });
          } catch (error) {
            console.error(`Failed to remove column ${column}:`, error.message);
          }
        }
      }
      
      // Revert indexes
      const indexes = await queryInterface.showIndex(tableName, { transaction });
      const indexNames = indexes.map(idx => idx.name);
      
      // Remove indexes added in this migration
      const indexesToRemove = [
        'idx_dynamic_configs_is_public',
        'idx_dynamic_configs_created_at'
      ];
      
      for (const indexName of indexesToRemove) {
        if (indexNames.includes(indexName)) {
          console.log(`Removing index ${indexName}...`);
          try {
            await queryInterface.removeIndex(tableName, indexName, { transaction });
          } catch (error) {
            console.error(`Failed to remove index ${indexName}:`, error.message);
          }
        }
      }
      
      await transaction.commit();
      console.log(`${tableName} rollback completed successfully`);
    } catch (error) {
      await transaction.rollback();
      console.error(`${tableName} rollback failed:`, error);
      throw new Error(`Failed to rollback ${tableName}: ${error.message}`);
    }
  }
};
