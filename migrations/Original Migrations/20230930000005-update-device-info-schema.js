'use strict';

/**
 * Migration to create and update the DeviceInfos table with proper schema and indexes.
 * Uses raw SQL queries for better compatibility.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'DeviceInfos';
    
    try {
      console.log(`Starting migration for ${tableName}...`);
      
      // Check if table exists using raw SQL
      const [tables] = await queryInterface.sequelize.query(
        `SHOW TABLES LIKE '${tableName}'`
      );
      const tableExists = tables.length > 0;
      
      if (!tableExists) {
        console.log(`Creating ${tableName} table...`);
        
        // Create the table with all necessary columns (without foreign key first)
        await queryInterface.sequelize.query(`
          CREATE TABLE ${tableName} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            device_id VARCHAR(255) NOT NULL,
            battery_info JSON COMMENT 'Battery level, charging status, etc.',
            storage_info JSON COMMENT 'Internal and external storage details',
            network_info JSON COMMENT 'Network type, strength, IP address',
            cpu_info JSON COMMENT 'CPU usage, cores, frequency',
            memory_info JSON COMMENT 'RAM usage, total and available memory',
            display_info JSON COMMENT 'Screen resolution, density, size',
            os_info JSON COMMENT 'OS version, security patch, build number',
            sensor_info JSON COMMENT 'Available sensors and their data',
            location_info JSON COMMENT 'Last known location data',
            last_sync_time DATETIME COMMENT 'When this info was last synced',
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `, { transaction });
        
        // Create indexes
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_device_infos_device_id ON ${tableName} (device_id);
        `, { transaction });
        
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_device_infos_last_sync ON ${tableName} (last_sync_time);
        `, { transaction });
        
        console.log(`Created ${tableName} table with indexes`);
        
        // Try to add foreign key constraint separately
        try {
          console.log('Attempting to add foreign key constraint...');
          await queryInterface.sequelize.query(`
            ALTER TABLE ${tableName}
            ADD CONSTRAINT fk_device_infos_device_id
            FOREIGN KEY (device_id) 
            REFERENCES devices(device_id) 
            ON DELETE CASCADE 
            ON UPDATE CASCADE;
          `, { transaction });
          console.log('Successfully added foreign key constraint');
        } catch (fkError) {
          console.warn('Could not add foreign key constraint:', fkError.message);
          console.log('Continuing without foreign key constraint...');
          // Continue without failing if foreign key can't be added
        }
      }
      if (tableExists) {
        // Only try to add columns if the table already exists
        console.log(`${tableName} table already exists, checking for updates...`);
        
        // Columns to add if they don't exist
        const columnsToAdd = [
          { name: 'battery_info', type: 'JSON COMMENT \'Battery level, charging status, etc.\'' },
          { name: 'storage_info', type: 'JSON COMMENT \'Internal and external storage details\'' },
          { name: 'network_info', type: 'JSON COMMENT \'Network type, strength, IP address\'' },
          { name: 'cpu_info', type: 'JSON COMMENT \'CPU usage, cores, frequency\'' },
          { name: 'memory_info', type: 'JSON COMMENT \'RAM usage, total and available memory\'' },
          { name: 'display_info', type: 'JSON COMMENT \'Screen resolution, density, size\'' },
          { name: 'os_info', type: 'JSON COMMENT \'OS version, security patch, build number\'' },
          { name: 'sensor_info', type: 'JSON COMMENT \'Available sensors and their data\'' },
          { name: 'location_info', type: 'JSON COMMENT \'Last known location data\'' },
          { name: 'last_sync_time', type: 'DATETIME COMMENT \'When this info was last synced\'' }
        ];
        
        // Check and add missing columns
        for (const column of columnsToAdd) {
          const [columnExists] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM ${tableName} LIKE '${column.name}'`,
            { transaction }
          );
          
          if (columnExists.length === 0) {
            console.log(`Adding column ${column.name}...`);
            await queryInterface.sequelize.query(
              `ALTER TABLE ${tableName} ADD COLUMN ${column.name} ${column.type}`,
              { transaction }
            );
          }
        }
        
        // Check and create indexes if they don't exist
        const indexesToCreate = [
          { name: 'idx_device_infos_device_id', columns: ['device_id'] },
          { name: 'idx_device_infos_last_sync', columns: ['last_sync_time'] }
        ];
        
        for (const index of indexesToCreate) {
          const [indexExists] = await queryInterface.sequelize.query(
            `SHOW INDEX FROM ${tableName} WHERE Key_name = '${index.name}'`,
            { transaction }
          );
          
          if (indexExists.length === 0) {
            console.log(`Creating index ${index.name}...`);
            await queryInterface.sequelize.query(
              `CREATE INDEX ${index.name} ON ${tableName} (${index.columns.join(', ')});`,
              { transaction }
            );
          }
        }
      }
      
      // Index creation is now handled in the table creation and table exists sections
      
      await transaction.commit();
      console.log('Device info schema update completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Device info schema update failed:', error);
      throw new Error(`Failed to update device info schema: ${error.message}`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'DeviceInfos';
    
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
        `DROP TABLE IF EXISTS ${tableName};`,
        { transaction }
      );
      
      await transaction.commit();
      console.log('Rollback completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Rollback failed:', error);
      throw new Error(`Failed to rollback device info schema: ${error.message}`);
    }
  }
};
