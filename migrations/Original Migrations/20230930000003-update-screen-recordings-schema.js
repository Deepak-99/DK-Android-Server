'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'ScreenRecordings';
    
    try {
      // Check if table exists
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
            \`recording_id\` VARCHAR(255) UNIQUE NOT NULL,
            \`file_name\` VARCHAR(255),
            \`file_path\` VARCHAR(255),
            \`file_size\` BIGINT,
            \`duration\` INT COMMENT 'Duration in seconds',
            \`status\` ENUM('recording', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'recording',
            \`format\` VARCHAR(10) DEFAULT 'mp4',
            \`resolution\` VARCHAR(20),
            \`frame_rate\` INT DEFAULT 30,
            \`bitrate\` INT COMMENT 'In kbps',
            \`start_time\` DATETIME,
            \`end_time\` DATETIME,
            \`metadata\` JSON,
            \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (\`device_id\`) REFERENCES \`devices\` (\`device_id\`) ON DELETE CASCADE ON UPDATE CASCADE
          ) ENGINE=InnoDB;
        `, { transaction });
        
        // Create indexes
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_screen_recordings_device_id ON \`${tableName}\` (\`device_id\`);
        `, { transaction });
        
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_screen_recordings_status ON \`${tableName}\` (\`status\`);
        `, { transaction });
        
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_screen_recordings_created_at ON \`${tableName}\` (\`createdAt\`);
        `, { transaction });
        
        console.log(`Created ${tableName} table with indexes`);
        await transaction.commit();
        return;
      }
      
      console.log(`${tableName} table already exists, checking for updates...`);
      
      // Columns to add if they don't exist
      const columnsToAdd = [
        { name: 'recording_id', type: 'VARCHAR(255) UNIQUE NOT NULL' },
        { name: 'file_name', type: 'VARCHAR(255)' },
        { name: 'file_path', type: 'VARCHAR(255)' },
        { name: 'file_size', type: 'BIGINT' },
        { name: 'duration', type: 'INT COMMENT \'Duration in seconds\'' },
        { name: 'status', type: "ENUM('recording', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'recording'" },
        { name: 'format', type: 'VARCHAR(10) DEFAULT \'mp4\'' },
        { name: 'resolution', type: 'VARCHAR(20)' },
        { name: 'frame_rate', type: 'INT DEFAULT 30' },
        { name: 'bitrate', type: 'INT COMMENT \'In kbps\'' },
        { name: 'start_time', type: 'DATETIME' },
        { name: 'end_time', type: 'DATETIME' },
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
        { name: 'idx_screen_recordings_device_id', columns: ['device_id'] },
        { name: 'idx_screen_recordings_status', columns: ['status'] },
        { name: 'idx_screen_recordings_created_at', columns: ['createdAt'] }
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
      console.log('Screen recordings schema update completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Screen recordings schema update failed:', error);
      throw new Error(`Failed to update screen recordings schema: ${error.message}`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'ScreenRecordings';
    
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
      throw new Error(`Failed to rollback screen recordings schema: ${error.message}`);
    }
  }
};
