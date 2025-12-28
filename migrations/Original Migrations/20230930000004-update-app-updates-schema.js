'use strict';

/**
 * Migration to create and update the AppUpdates table with proper schema and indexes.
 * Handles both initial table creation and schema updates in a single migration.
 * Uses raw SQL queries for better compatibility.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'AppUpdates';
    
    try {
      console.log(`Starting migration for ${tableName}...`);
      
      // Check if table exists using raw SQL
      const [tables] = await queryInterface.sequelize.query(
        `SHOW TABLES LIKE '${tableName}'`
      );
      const tableExists = tables.length > 0;
      
      if (!tableExists) {
        console.log(`Creating ${tableName} table...`);
        
        // Create the table with all necessary columns
        await queryInterface.sequelize.query(`
          CREATE TABLE \`${tableName}\` (
            \`id\` VARCHAR(36) PRIMARY KEY,
            \`version_code\` INT NOT NULL COMMENT 'Version code (incremental number)',
            \`version_name\` VARCHAR(50) NOT NULL COMMENT 'Version name (e.g., 1.0.0)',
            \`min_sdk_version\` INT NOT NULL DEFAULT 21 COMMENT 'Minimum required SDK version',
            \`target_sdk_version\` INT NOT NULL DEFAULT 33 COMMENT 'Target SDK version',
            \`update_type\` ENUM('optional', 'recommended', 'required') NOT NULL DEFAULT 'optional' COMMENT 'Type of update',
            \`release_notes\` TEXT COMMENT 'Release notes in markdown format',
            \`file_size\` BIGINT COMMENT 'Size of the update file in bytes',
            \`file_url\` VARCHAR(512) COMMENT 'URL to download the update file',
            \`file_checksum\` VARCHAR(128) COMMENT 'SHA-256 checksum of the update file',
            \`is_active\` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Whether this update is active and should be served to users',
            \`rollout_percentage\` INT DEFAULT 100 COMMENT 'Percentage of users who should receive this update (0-100)',
            \`min_os_version\` VARCHAR(20) COMMENT 'Minimum OS version required (e.g., 8.0)',
            \`max_os_version\` VARCHAR(20) COMMENT 'Maximum OS version supported',
            \`device_models\` JSON COMMENT 'Array of supported device models (null for all)',
            \`regions\` JSON COMMENT 'Array of region codes where this update is available (null for all)',
            \`release_date\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When this update was released',
            \`end_of_life\` DATETIME COMMENT 'When this update will no longer be served',
            \`created_by\` VARCHAR(255) COMMENT 'User/process that created this update',
            \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            \`deletedAt\` DATETIME DEFAULT NULL
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `, { transaction });
        
        // Create indexes
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_app_updates_version_code ON \`${tableName}\` (\`version_code\`);
        `, { transaction });
        
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_app_updates_update_type ON \`${tableName}\` (\`update_type\`);
        `, { transaction });
        
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_app_updates_is_active ON \`${tableName}\` (\`is_active\`);
        `, { transaction });
        
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_app_updates_release_date ON \`${tableName}\` (\`release_date\`);
        `, { transaction });
        
        console.log(`Created ${tableName} table with indexes`);
        await transaction.commit();
        return;
      }
      
      console.log(`${tableName} table already exists, checking for updates...`);
      
      // Columns to add if they don't exist
      const columnsToAdd = [
        { name: 'version_code', type: 'INT NOT NULL COMMENT \'Version code (incremental number)\'' },
        { name: 'version_name', type: 'VARCHAR(50) NOT NULL COMMENT \'Version name (e.g., 1.0.0)\'' },
        { name: 'min_sdk_version', type: 'INT NOT NULL DEFAULT 21 COMMENT \'Minimum required SDK version\'' },
        { name: 'target_sdk_version', type: 'INT NOT NULL DEFAULT 33 COMMENT \'Target SDK version\'' },
        { name: 'update_type', type: "ENUM('optional', 'recommended', 'required') NOT NULL DEFAULT 'optional' COMMENT 'Type of update'" },
        { name: 'release_notes', type: 'TEXT COMMENT \'Release notes in markdown format\'' },
        { name: 'file_size', type: 'BIGINT COMMENT \'Size of the update file in bytes\'' },
        { name: 'file_url', type: 'VARCHAR(512) COMMENT \'URL to download the update file\'' },
        { name: 'file_checksum', type: 'VARCHAR(128) COMMENT \'SHA-256 checksum of the update file\'' },
        { name: 'is_active', type: 'TINYINT(1) NOT NULL DEFAULT 1 COMMENT \'Whether this update is active and should be served to users\'' },
        { name: 'rollout_percentage', type: 'INT DEFAULT 100 COMMENT \'Percentage of users who should receive this update (0-100)\'' },
        { name: 'min_os_version', type: 'VARCHAR(20) COMMENT \'Minimum OS version required (e.g., 8.0)\'' },
        { name: 'max_os_version', type: 'VARCHAR(20) COMMENT \'Maximum OS version supported\'' },
        { name: 'device_models', type: 'JSON COMMENT \'Array of supported device models (null for all)\'' },
        { name: 'regions', type: 'JSON COMMENT \'Array of region codes where this update is available (null for all)\'' },
        { name: 'release_date', type: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT \'When this update was released\'' },
        { name: 'end_of_life', type: 'DATETIME COMMENT \'When this update will no longer be served\'' },
        { name: 'created_by', type: 'VARCHAR(255) COMMENT \'User/process that created this update\'' },
        { name: 'deletedAt', type: 'DATETIME DEFAULT NULL' }
      ];
      
      // Check and add missing columns
      for (const column of columnsToAdd) {
        const [columnExists] = await queryInterface.sequelize.query(
          `SHOW COLUMNS FROM \`${tableName}\` LIKE '${column.name}'`,
          { transaction }
        );
        
        if (columnExists.length === 0) {
          console.log(`Adding column ${column.name}...`);
          await queryInterface.sequelize.query(
            `ALTER TABLE \`${tableName}\` ADD COLUMN \`${column.name}\` ${column.type}`,
            { transaction }
          );
        }
      }
      
      // Check and create indexes if they don't exist
      const indexesToCreate = [
        { name: 'idx_app_updates_version_code', columns: ['version_code'] },
        { name: 'idx_app_updates_update_type', columns: ['update_type'] },
        { name: 'idx_app_updates_is_active', columns: ['is_active'] },
        { name: 'idx_app_updates_release_date', columns: ['release_date'] }
      ];
      
      for (const index of indexesToCreate) {
        const [indexExists] = await queryInterface.sequelize.query(
          `SHOW INDEX FROM \`${tableName}\` WHERE Key_name = '${index.name}'`,
          { transaction }
        );
        
        if (indexExists.length === 0) {
          console.log(`Creating index ${index.name}...`);
          await queryInterface.sequelize.query(
            `CREATE INDEX ${index.name} ON \`${tableName}\` (${index.columns.map(c => `\`${c}\``).join(', ')});`,
            { transaction }
          );
        }
      }
      
      await transaction.commit();
      console.log('App updates schema update completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('App updates schema update failed:', error);
      throw new Error(`Failed to update app updates schema: ${error.message}`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'AppUpdates';
    
    try {
      // Check if table exists
      const [tables] = await queryInterface.sequelize.query(
        `SHOW TABLES LIKE '${tableName}'`
      );
      
      if (tables.length === 0) {
        console.log(`Table ${tableName} does not exist, nothing to rollback`);
        await transaction.commit();
        return;
      }
      
      console.log(`Dropping table ${tableName}...`);
      await queryInterface.sequelize.query(
        `DROP TABLE IF EXISTS \`${tableName}\`;`,
        { transaction }
      );
      
      await transaction.commit();
      console.log('Rollback completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Rollback failed:', error);
      throw new Error(`Failed to rollback app updates schema: ${error.message}`);
    }
  }
};
