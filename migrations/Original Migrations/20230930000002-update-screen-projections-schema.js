'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'ScreenProjections';
    
    try {
      // Check if table exists using raw query
      const [tables] = await queryInterface.sequelize.query(
        `SHOW TABLES LIKE '${tableName}'`
      );
      const tableExists = tables.length > 0;
      
      if (!tableExists) {
        console.log(`Creating ${tableName} table...`);
        
        // Create the table with all necessary columns
        await queryInterface.sequelize.query(`
          CREATE TABLE \`${tableName}\` (
            \`id\` INT AUTO_INCREMENT PRIMARY KEY,
            \`device_id\` VARCHAR(255) NOT NULL,
            \`session_id\` VARCHAR(255) UNIQUE NOT NULL,
            \`projection_type\` ENUM('live_stream', 'remote_control', 'view_only') NOT NULL DEFAULT 'view_only',
            \`status\` ENUM('starting', 'active', 'paused', 'stopped', 'error') NOT NULL DEFAULT 'starting',
            \`resolution\` VARCHAR(20),
            \`frame_rate\` INT DEFAULT 15,
            \`quality\` ENUM('low', 'medium', 'high') DEFAULT 'medium',
            \`compression\` INT DEFAULT 80,
            \`viewer_count\` INT DEFAULT 0 NOT NULL,
            \`max_viewers\` INT DEFAULT 5,
            \`duration\` INT,
            \`bytes_transmitted\` BIGINT DEFAULT 0 NOT NULL,
            \`frames_transmitted\` INT DEFAULT 0 NOT NULL,
            \`screenshot_data\` TEXT,
            \`connection_info\` JSON,
            \`viewer_sessions\` JSON,
            \`last_active\` DATETIME,
            \`metadata\` JSON,
            \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (\`device_id\`) REFERENCES \`devices\` (\`device_id\`) ON DELETE CASCADE ON UPDATE CASCADE
          ) ENGINE=InnoDB;
        `, { transaction });
        
        // Create indexes
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_screen_projections_device_id ON \`${tableName}\` (\`device_id\`);
        `, { transaction });
        
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_screen_projections_created_at ON \`${tableName}\` (\`createdAt\`);
        `, { transaction });
        
        console.log(`Created ${tableName} table with indexes`);
        await transaction.commit();
        return;
      }
      
      console.log(`${tableName} table already exists, checking for updates...`);
      
      // Columns to add if they don't exist
      const columnsToAdd = [
        { name: 'session_id', type: 'VARCHAR(255) UNIQUE NOT NULL' },
        { name: 'projection_type', type: "ENUM('live_stream', 'remote_control', 'view_only') NOT NULL DEFAULT 'view_only'" },
        { name: 'status', type: "ENUM('starting', 'active', 'paused', 'stopped', 'error') NOT NULL DEFAULT 'starting'" },
        { name: 'resolution', type: 'VARCHAR(20)' },
        { name: 'frame_rate', type: 'INT DEFAULT 15' },
        { name: 'quality', type: "ENUM('low', 'medium', 'high') DEFAULT 'medium'" },
        { name: 'compression', type: 'INT DEFAULT 80' },
        { name: 'viewer_count', type: 'INT DEFAULT 0 NOT NULL' },
        { name: 'max_viewers', type: 'INT DEFAULT 5' },
        { name: 'duration', type: 'INT' },
        { name: 'bytes_transmitted', type: 'BIGINT DEFAULT 0 NOT NULL' },
        { name: 'frames_transmitted', type: 'INT DEFAULT 0 NOT NULL' },
        { name: 'connection_info', type: 'JSON' },
        { name: 'viewer_sessions', type: 'JSON' },
        { name: 'last_active', type: 'DATETIME' },
        { name: 'metadata', type: 'JSON' }
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
        { name: 'idx_screen_projections_device_id', columns: ['device_id'] },
        { name: 'idx_screen_projections_created_at', columns: ['createdAt'] }
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
      console.log('Screen projections schema update completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Screen projections schema update failed:', error);
      throw new Error(`Failed to update screen projections schema: ${error.message}`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'ScreenProjections';
    
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
      throw new Error(`Failed to rollback screen projections schema: ${error.message}`);
    }
  }
};
