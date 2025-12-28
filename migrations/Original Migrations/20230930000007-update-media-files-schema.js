'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'media_files';
    
    try {
      // Check if table exists
      const [tables] = await queryInterface.sequelize.query(
        `SHOW TABLES LIKE '${tableName}'`,
        { transaction }
      );
      
      if (tables.length === 0) {
        // If table doesn't exist, create it with the correct schema
        await queryInterface.createTable(tableName, {
          id: {
            type: Sequelize.INTEGER.UNSIGNED,
            autoIncrement: true,
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
          filename: {
            type: Sequelize.STRING(255),
            allowNull: false
          },
          original_name: {
            type: Sequelize.STRING(500),
            allowNull: false
          },
          file_path: {
            type: Sequelize.TEXT,
            allowNull: false
          },
          file_size: {
            type: Sequelize.BIGINT,
            allowNull: false,
            comment: 'File size in bytes'
          },
          mime_type: {
            type: Sequelize.STRING(255),
            allowNull: false
          },
          media_type: {
            type: Sequelize.ENUM('image', 'video', 'audio', 'document', 'other'),
            allowNull: false
          },
          duration: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Duration in seconds for video/audio files'
          },
          width: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Width in pixels for images/videos'
          },
          height: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Height in pixels for images/videos'
          },
          thumbnail_path: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          captured_at: {
            type: Sequelize.DATE,
            allowNull: true,
            comment: 'When the media was originally captured'
          },
          location_latitude: {
            type: Sequelize.DECIMAL(10, 8),
            allowNull: true
          },
          location_longitude: {
            type: Sequelize.DECIMAL(11, 8),
            allowNull: true
          },
          upload_status: {
            type: Sequelize.ENUM('pending', 'uploading', 'completed', 'failed'),
            defaultValue: 'completed'
          },
          upload_progress: {
            type: Sequelize.INTEGER,
            defaultValue: 100,
            validate: {
              min: 0,
              max: 100
            }
          },
          metadata: {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'Additional metadata like EXIF data'
          },
          is_deleted: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
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
        
        // Add indexes
        await queryInterface.addIndex(tableName, ['device_id'], {
          name: 'idx_media_files_device_id',
          transaction
        });
        
        await queryInterface.addIndex(tableName, ['media_type'], {
          name: 'idx_media_files_media_type',
          transaction
        });
        
        await queryInterface.addIndex(tableName, ['captured_at'], {
          name: 'idx_media_files_captured_at',
          transaction
        });
        
        await transaction.commit();
        return;
      }
      // Table exists, check and add missing columns
      const columns = await queryInterface.describeTable(tableName, { transaction });
      
      // Add missing columns
      if (!columns.original_name) {
        // First, check if file_name column exists to copy data from it
        const hasFileName = columns.file_name !== undefined;
        
        // Add original_name column without the AFTER clause
        await queryInterface.addColumn(
          tableName,
          'original_name',
          {
            type: Sequelize.STRING(500),
            allowNull: false,
            defaultValue: ''
          },
          { transaction }
        );
        
        // If file_name exists, copy data from it
        if (hasFileName) {
          await queryInterface.sequelize.query(
            `UPDATE ${tableName} SET original_name = file_name`,
            { transaction }
          );
        }
        
        // If filename column exists, we can now reorder the column
        if (columns.filename) {
          try {
            await queryInterface.sequelize.query(
              `ALTER TABLE ${tableName} MODIFY COLUMN original_name VARCHAR(500) NOT NULL DEFAULT '' AFTER filename`,
              { transaction }
            );
          } catch (error) {
            console.warn('Could not reorder original_name column after filename:', error.message);
          }
        }
      }
      
      if (!columns.upload_status) {
        await queryInterface.addColumn(
          tableName,
          'upload_status',
          {
            type: Sequelize.ENUM('pending', 'uploading', 'completed', 'failed'),
            allowNull: false,
            defaultValue: 'completed',
            after: 'metadata'
          },
          { transaction }
        );
      }
      
      if (!columns.upload_progress) {
        await queryInterface.addColumn(
          tableName,
          'upload_progress',
          {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 100,
            after: 'upload_status',
            validate: {
              min: 0,
              max: 100
            }
          },
          { transaction }
        );
      }
      
      if (!columns.is_deleted) {
        await queryInterface.addColumn(
          tableName,
          'is_deleted',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            after: 'metadata'
          },
          { transaction }
        );
      }
      
      // Check for and add location_latitude and location_longitude if location exists
      if (columns.location && !columns.location_latitude) {
        // Add location_latitude and location_longitude columns
        await queryInterface.addColumn(
          tableName,
          'location_latitude',
          {
            type: Sequelize.DECIMAL(10, 8),
            allowNull: true,
            after: 'location'
          },
          { transaction }
        );
        
        await queryInterface.addColumn(
          tableName,
          'location_longitude',
          {
            type: Sequelize.DECIMAL(11, 8),
            allowNull: true,
            after: 'location_latitude'
          },
          { transaction }
        );
        
        // Extract latitude and longitude from POINT data if available
        await queryInterface.sequelize.query(
          `UPDATE ${tableName} 
           SET location_latitude = ST_Y(location), 
               location_longitude = ST_X(location) 
           WHERE location IS NOT NULL`,
          { transaction }
        );
      }
      
      // Rename date_taken to captured_at if it exists
      if (columns.date_taken && !columns.captured_at) {
        await queryInterface.renameColumn(
          tableName,
          'date_taken',
          'captured_at',
          { transaction }
        );
      }
      
      // Rename file_name to filename if it exists and filename doesn't
      if (columns.file_name && !columns.filename) {
        await queryInterface.renameColumn(
          tableName,
          'file_name',
          'filename',
          { transaction }
        );
      }
      
      // Add any missing indexes
      const indexes = await queryInterface.showIndex(tableName, { transaction });
      
      if (!indexes.some(idx => idx.name === 'idx_media_files_captured_at')) {
        await queryInterface.addIndex(
          tableName, 
          ['captured_at'],
          {
            name: 'idx_media_files_captured_at',
            transaction
          }
        );
      }
      
      if (!indexes.some(idx => idx.name === 'idx_media_files_upload_status')) {
        await queryInterface.addIndex(
          tableName, 
          ['upload_status'],
          {
            name: 'idx_media_files_upload_status',
            transaction
          }
        );
      }
      
      if (!indexes.some(idx => idx.name === 'idx_media_files_is_deleted')) {
        await queryInterface.addIndex(
          tableName, 
          ['is_deleted'],
          {
            name: 'idx_media_files_is_deleted',
            transaction
          }
        );
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error in media_files migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Note: This is a complex migration and cannot be fully rolled back automatically
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'media_files';
    
    try {
      const columns = await queryInterface.describeTable(tableName, { transaction });
      
      // Remove added columns if they exist
      if (columns.original_name) {
        await queryInterface.removeColumn(tableName, 'original_name', { transaction });
      }
      
      if (columns.upload_status) {
        await queryInterface.removeColumn(tableName, 'upload_status', { transaction });
      }
      
      if (columns.upload_progress) {
        await queryInterface.removeColumn(tableName, 'upload_progress', { transaction });
      }
      
      if (columns.is_deleted) {
        await queryInterface.removeColumn(tableName, 'is_deleted', { transaction });
      }
      
      // Remove location_latitude and location_longitude if they exist
      if (columns.location_latitude) {
        await queryInterface.removeColumn(tableName, 'location_latitude', { transaction });
      }
      
      if (columns.location_longitude) {
        await queryInterface.removeColumn(tableName, 'location_longitude', { transaction });
      }
      
      // Rename columns back if needed
      if (columns.captured_at && !columns.date_taken) {
        await queryInterface.renameColumn(
          tableName,
          'captured_at',
          'date_taken',
          { transaction }
        );
      }
      
      if (columns.filename && !columns.file_name) {
        await queryInterface.renameColumn(
          tableName,
          'filename',
          'file_name',
          { transaction }
        );
      }
      
      // Remove added indexes
      const indexes = await queryInterface.showIndex(tableName, { transaction });
      
      if (indexes.some(idx => idx.name === 'idx_media_files_captured_at')) {
        await queryInterface.removeIndex(tableName, 'idx_media_files_captured_at', { transaction });
      }
      
      if (indexes.some(idx => idx.name === 'idx_media_files_upload_status')) {
        await queryInterface.removeIndex(tableName, 'idx_media_files_upload_status', { transaction });
      }
      
      if (indexes.some(idx => idx.name === 'idx_media_files_is_deleted')) {
        await queryInterface.removeIndex(tableName, 'idx_media_files_is_deleted', { transaction });
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error rolling back media_files migration:', error);
      throw error;
    }
  }
};
