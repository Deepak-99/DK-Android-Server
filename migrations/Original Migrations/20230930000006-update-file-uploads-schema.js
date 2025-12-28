'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'file_uploads';
    
    try {
      // Check if table exists
      const [tables] = await queryInterface.sequelize.query(
        `SHOW TABLES LIKE '${tableName}'`,
        { transaction }
      );
      
      if (tables.length === 0) {
        console.log(`Table ${tableName} does not exist, nothing to update`);
        await transaction.commit();
        return;
      }

      // Check if the id column is INT UNSIGNED
      const [columns] = await queryInterface.sequelize.query(
        `SHOW COLUMNS FROM ${tableName} WHERE Field = 'id'`,
        { transaction }
      );
      
      if (columns.length === 0 || columns[0].Type.includes('int')) {
        // Create a temporary table with the new schema
        await queryInterface.createTable('file_uploads_new', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          device_id: {
            type: Sequelize.STRING(255),
            allowNull: false,
            references: {
              model: 'devices',
              key: 'device_id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          file_name: {
            type: Sequelize.STRING(255),
            allowNull: false
          },
          original_name: {
            type: Sequelize.STRING(500),
            allowNull: true
          },
          file_path: {
            type: Sequelize.TEXT,
            allowNull: false
          },
          file_size: {
            type: Sequelize.BIGINT,
            allowNull: false
          },
          file_type: {
            type: Sequelize.STRING(100),
            allowNull: true
          },
          mime_type: {
            type: Sequelize.STRING(100),
            allowNull: true
          },
          md5_hash: {
            type: Sequelize.STRING(32),
            allowNull: true
          },
          upload_status: {
            type: Sequelize.ENUM('pending', 'uploading', 'completed', 'failed'),
            defaultValue: 'pending'
          },
          metadata: {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'Additional file metadata'
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
          }
        }, { transaction });

        // Copy data from old table to new table
        await queryInterface.sequelize.query(
          `INSERT INTO file_uploads_new 
           (device_id, file_name, file_path, file_size, file_type, mime_type, 
            md5_hash, upload_status, metadata, created_at, updated_at)
           SELECT 
             device_id, 
             file_name,
             file_path, 
             file_size,
             file_type,
             COALESCE(mime_type, 'application/octet-stream') as mime_type,
             md5_hash,
             COALESCE(upload_status, 'completed') as upload_status,
             metadata,
             created_at, 
             updated_at
           FROM file_uploads`,
          { transaction }
        );

        // First, drop the foreign key constraint if it exists
        try {
          await queryInterface.sequelize.query(
            'ALTER TABLE file_uploads_new DROP FOREIGN KEY file_uploads_new_ibfk_1',
            { transaction }
          );
        } catch (error) {
          console.log('No foreign key constraint to drop');
        }
        
        // Drop old table and rename new one
        await queryInterface.sequelize.query('DROP TABLE IF EXISTS file_uploads', { transaction });
        await queryInterface.sequelize.query('RENAME TABLE file_uploads_new TO file_uploads', { transaction });
        
        // Add the foreign key constraint with the correct column name
        await queryInterface.sequelize.query(
          'ALTER TABLE file_uploads ADD CONSTRAINT fk_file_uploads_device_id ' +
          'FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE ON UPDATE CASCADE',
          { transaction }
        );
      }

      // Add any missing columns that might be needed
      const [existingColumns] = await queryInterface.sequelize.query(
        `SHOW COLUMNS FROM ${tableName}`,
        { transaction }
      );
      
      const columnNames = existingColumns.map(col => col.Field);
      
      // Add original_name if it doesn't exist
      if (!columnNames.includes('original_name')) {
        console.log('Adding original_name column...');
        await queryInterface.sequelize.query(
          `ALTER TABLE ${tableName} 
           ADD COLUMN original_name VARCHAR(500) NULL COMMENT 'Original filename' AFTER file_name`,
          { transaction }
        );
      }
      
      // Add upload_progress if it doesn't exist
      if (!columnNames.includes('upload_progress')) {
        console.log('Adding upload_progress column...');
        await queryInterface.sequelize.query(
          `ALTER TABLE ${tableName} 
           ADD COLUMN upload_progress INT NOT NULL DEFAULT 0 AFTER upload_status`,
          { transaction }
        );
      }
      
      // Add indexes if they don't exist
      const [indexes] = await queryInterface.sequelize.query(
        `SHOW INDEX FROM ${tableName}`,
        { transaction }
      );
      
      const indexNames = [...new Set(indexes.map(idx => idx.Key_name))];
      
      if (!indexNames.includes('idx_file_uploads_file_type')) {
        console.log('Adding index on file_type...');
        await queryInterface.sequelize.query(
          `CREATE INDEX idx_file_uploads_file_type ON ${tableName}(file_type)`,
          { transaction }
        );
      }
      
      if (!indexNames.includes('idx_file_uploads_upload_status')) {
        console.log('Adding index on upload_status...');
        await queryInterface.sequelize.query(
          `CREATE INDEX idx_file_uploads_upload_status ON ${tableName}(upload_status)`,
          { transaction }
        );
      }
      
      await transaction.commit();
      console.log('Successfully updated file_uploads table');
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating file_uploads table:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // This is a one-way migration, can't be rolled back safely
    console.log('This migration cannot be rolled back');
  }
};
