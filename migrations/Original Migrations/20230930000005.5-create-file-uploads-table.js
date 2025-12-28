'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'file_uploads';
    
    try {
      // Check if table already exists
      const [tables] = await queryInterface.sequelize.query(
        `SHOW TABLES LIKE '${tableName}'`,
        { transaction }
      );
      
      if (tables.length > 0) {
        console.log(`Table ${tableName} already exists, skipping creation`);
        await transaction.commit();
        return;
      }

      console.log(`Creating table ${tableName}...`);
      
      // Create the table without the foreign key constraint first
      await queryInterface.sequelize.query(`
        CREATE TABLE ${tableName} (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          device_id VARCHAR(255) NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          file_path TEXT NOT NULL,
          file_size BIGINT NOT NULL,
          file_type VARCHAR(100),
          mime_type VARCHAR(100),
          md5_hash VARCHAR(32),
          original_path TEXT COMMENT 'Original path on the device',
          upload_status ENUM('pending', 'uploading', 'completed', 'failed') DEFAULT 'pending',
          metadata JSON COMMENT 'Additional file metadata',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_file_uploads_device_id (device_id),
          INDEX idx_file_uploads_md5 (md5_hash),
          INDEX idx_file_uploads_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `, { transaction });
      
      console.log(`Created table ${tableName} with indexes`);
      
      // Try to add foreign key constraint separately
      try {
        console.log('Attempting to add foreign key constraint...');
        await queryInterface.sequelize.query(`
          ALTER TABLE ${tableName}
          ADD CONSTRAINT fk_file_uploads_device_id
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
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(`Error creating ${tableName} table:`, error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'file_uploads';
    
    try {
      // Check if table exists
      const [tables] = await queryInterface.sequelize.query(
        `SHOW TABLES LIKE '${tableName}'`,
        { transaction }
      );
      
      if (tables.length === 0) {
        console.log(`Table ${tableName} does not exist, nothing to drop`);
        await transaction.commit();
        return;
      }
      
      console.log(`Dropping table ${tableName}...`);
      await queryInterface.sequelize.query(
        `DROP TABLE IF EXISTS ${tableName}`,
        { transaction }
      );
      
      console.log(`Dropped table ${tableName}`);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(`Error dropping ${tableName} table:`, error);
      throw error;
    }
  }
};
