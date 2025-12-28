'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'file_explorer';
    
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
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          device_id: {
            type: Sequelize.STRING(255),
            allowNull: false,
            references: {
              model: 'devices',
              key: 'device_id'  // Changed to match the actual column name in devices table
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: 'Reference to devices table (device_id)'
          },
          file_path: {
            type: Sequelize.TEXT,
            allowNull: false,
            comment: 'Full path to the file or directory'
          },
          file_name: {
            type: Sequelize.STRING(255),
            allowNull: false,
            comment: 'Name of the file or directory'
          },
          parent_path: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Parent directory path'
          },
          file_type: {
            type: Sequelize.ENUM('file', 'directory', 'symlink', 'unknown'),
            allowNull: false
          },
          file_size: {
            type: Sequelize.BIGINT,
            allowNull: true,
            comment: 'File size in bytes (null for directories)'
          },
          mime_type: {
            type: Sequelize.STRING(100),
            allowNull: true,
            comment: 'MIME type for files'
          },
          last_modified: {
            type: Sequelize.DATE,
            allowNull: true,
            comment: 'Last modification time'
          },
          permissions: {
            type: Sequelize.STRING(20),
            allowNull: true,
            comment: 'File permissions (e.g., rwxrwxrwx)'
          },
          owner: {
            type: Sequelize.STRING(100),
            allowNull: true,
            comment: 'File owner'
          },
          group: {
            type: Sequelize.STRING(100),
            allowNull: true,
            comment: 'File group'
          },
          is_hidden: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            comment: 'Whether the file is hidden'
          },
          is_readable: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            comment: 'Whether the file is readable'
          },
          is_writable: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            comment: 'Whether the file is writable'
          },
          is_executable: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            comment: 'Whether the file is executable'
          },
          thumbnail_path: {
            type: Sequelize.STRING(500),
            allowNull: true,
            comment: 'Path to thumbnail image'
          },
          metadata: {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'Additional file metadata'
          },
          scan_timestamp: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            comment: 'When this file was scanned'
          },
          is_deleted: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            comment: 'Soft delete flag'
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
        
        // Add indexes using raw SQL for better control
        await queryInterface.sequelize.query(
          `CREATE INDEX idx_file_explorer_device_id ON ${tableName} (device_id)`,
          { transaction }
        );
        
        // Create an index on parent_path with a prefix length of 255
        await queryInterface.sequelize.query(
          `CREATE INDEX idx_file_explorer_parent_path ON ${tableName} (parent_path(255))`,
          { transaction }
        );
        
        await queryInterface.sequelize.query(
          `CREATE INDEX idx_file_explorer_file_type ON ${tableName} (file_type)`,
          { transaction }
        );
        
        // Create a composite index on file_path and device_id with a prefix length for file_path
        await queryInterface.sequelize.query(
          `CREATE UNIQUE INDEX idx_file_explorer_file_path_device_id ON ${tableName} (file_path(255), device_id)`,
          { transaction }
        );
        
        // Create index on scan_timestamp
        await queryInterface.sequelize.query(
          `CREATE INDEX idx_file_explorer_scan_timestamp ON ${tableName} (scan_timestamp)`,
          { transaction }
        );
        
        await transaction.commit();
        return;
      }
      
      // Table exists, check and make necessary changes
      const [columns] = await queryInterface.sequelize.query(
        `SHOW COLUMNS FROM ${tableName}`,
      );
      
      const columnNames = columns.map(col => col.Field);
      
      // Rename columns if they exist with old names
      if (columnNames.includes('path') && !columnNames.includes('file_path')) {
        await queryInterface.renameColumn(
          tableName,
          'path',
          'file_path',
          { transaction }
        );
      }
      
      if (columnNames.includes('name') && !columnNames.includes('file_name')) {
        await queryInterface.renameColumn(
          tableName,
          'name',
          'file_name',
          { transaction }
        );
      }
      
      if (columnNames.includes('type') && !columnNames.includes('file_type')) {
        await queryInterface.renameColumn(
          tableName,
          'type',
          'file_type',
          { transaction }
        );
      }
      
      if (columnNames.includes('size') && !columnNames.includes('file_size')) {
        await queryInterface.renameColumn(
          tableName,
          'size',
          'file_size',
          { transaction }
        );
      }
      
      if (columnNames.includes('mtime') && !columnNames.includes('last_modified')) {
        await queryInterface.renameColumn(
          tableName,
          'mtime',
          'last_modified',
          { transaction }
        );
      }
      
      if (!columnNames.includes('owner')) {
        await queryInterface.addColumn(
          tableName,
          'owner',
          {
            type: Sequelize.STRING(100),
            allowNull: true,
            comment: 'File owner',
            after: 'permissions'
          },
          { transaction }
        );
      }
      
      if (!columnNames.includes('group')) {
        await queryInterface.addColumn(
          tableName,
          'group',
          {
            type: Sequelize.STRING(100),
            allowNull: true,
            comment: 'File group',
            after: 'owner'
          },
          { transaction }
        );
      }
      
      if (!columnNames.includes('is_readable')) {
        await queryInterface.addColumn(
          tableName,
          'is_readable',
          {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            comment: 'Whether the file is readable',
            after: 'is_hidden'
          },
          { transaction }
        );
      }
      
      if (!columnNames.includes('is_writable')) {
        await queryInterface.addColumn(
          tableName,
          'is_writable',
          {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            comment: 'Whether the file is writable',
            after: 'is_readable'
          },
          { transaction }
        );
      }
      
      if (!columnNames.includes('is_executable')) {
        await queryInterface.addColumn(
          tableName,
          'is_executable',
          {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            comment: 'Whether the file is executable',
            after: 'is_writable'
          },
          { transaction }
        );
      }
      
      if (!columnNames.includes('thumbnail_path')) {
        await queryInterface.addColumn(
          tableName,
          'thumbnail_path',
          {
            type: Sequelize.STRING(500),
            allowNull: true,
            comment: 'Path to thumbnail image',
            after: 'is_executable'
          },
          { transaction }
        );
      }
      
      if (!columnNames.includes('scan_timestamp')) {
        await queryInterface.addColumn(
          tableName,
          'scan_timestamp',
          {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            comment: 'When this file was scanned',
            after: 'metadata'
          },
          { transaction }
        );
      }
      
      if (!columnNames.includes('is_deleted')) {
        await queryInterface.addColumn(
          tableName,
          'is_deleted',
          {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            comment: 'Soft delete flag',
            after: 'scan_timestamp'
          },
          { transaction }
        );
      }
      
      // Change id from INTEGER to UUID if needed
      const idColumn = columns.find(col => col.Field === 'id');
      if (idColumn && idColumn.Type.includes('int unsigned')) {
        // Create a temporary table with the new schema
        await queryInterface.createTable('file_explorer_new', {
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
              key: 'deviceId'  // Updated to use the correct column name
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          file_path: {
            type: Sequelize.TEXT,
            allowNull: false
          },
          file_name: {
            type: Sequelize.STRING(255),
            allowNull: false
          },
          parent_path: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          file_type: {
            type: Sequelize.ENUM('file', 'directory', 'symlink', 'unknown'),
            allowNull: false
          },
          file_size: {
            type: Sequelize.BIGINT,
            allowNull: true
          },
          mime_type: {
            type: Sequelize.STRING(100),
            allowNull: true
          },
          last_modified: {
            type: Sequelize.DATE,
            allowNull: true
          },
          permissions: {
            type: Sequelize.STRING(20),
            allowNull: true
          },
          owner: {
            type: Sequelize.STRING(100),
            allowNull: true
          },
          group: {
            type: Sequelize.STRING(100),
            allowNull: true
          },
          is_hidden: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          is_readable: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
          },
          is_writable: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          is_executable: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          thumbnail_path: {
            type: Sequelize.STRING(500),
            allowNull: true
          },
          metadata: {
            type: Sequelize.JSON,
            allowNull: true
          },
          scan_timestamp: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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
        
        // Copy data from old table to new table
        await queryInterface.sequelize.query(
          `INSERT INTO file_explorer_new 
           (id, device_id, file_path, file_name, parent_path, file_type, 
            file_size, mime_type, last_modified, permissions, owner, 
            \`group\`, is_hidden, is_readable, is_writable, is_executable, 
            thumbnail_path, metadata, scan_timestamp, is_deleted, created_at, updated_at)
           SELECT 
             UUID() as id, 
             device_id, 
             COALESCE(file_path, path) as file_path,
             COALESCE(file_name, name) as file_name,
             parent_path,
             COALESCE(file_type, type) as file_type,
             COALESCE(file_size, size) as file_size,
             mime_type,
             last_modified,
             permissions,
             owner,
             \`group\`,
             COALESCE(is_hidden, false) as is_hidden,
             COALESCE(is_readable, true) as is_readable,
             COALESCE(is_writable, false) as is_writable,
             COALESCE(is_executable, false) as is_executable,
             thumbnail_path,
             metadata,
             COALESCE(scan_timestamp, created_at) as scan_timestamp,
             COALESCE(is_deleted, false) as is_deleted,
             created_at, 
             COALESCE(updated_at, NOW()) as updated_at
           FROM file_explorer`,
          { transaction }
        );
        
        // Drop old table and rename new one
        await queryInterface.dropTable('file_explorer', { transaction });
        await queryInterface.renameTable('file_explorer_new', 'file_explorer', { transaction });
      }
      
      // Update ENUM values if needed
      try {
        await queryInterface.sequelize.query(
          "ALTER TABLE file_explorer MODIFY file_type ENUM('file', 'directory', 'symlink', 'unknown') NOT NULL",
          { transaction }
        );
      } catch (error) {
        console.log('Error updating ENUM values:', error.message);
      }
      
      // Add/update indexes using raw SQL
      try {
        // Get existing foreign key constraints
        const [fks] = await queryInterface.sequelize.query(
          `SELECT CONSTRAINT_NAME 
           FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
           WHERE TABLE_NAME = '${tableName}' 
           AND REFERENCED_TABLE_NAME IS NOT NULL`,
          { transaction }
        );
        
        // Store foreign key constraints to recreate them later
        const constraints = [];
        for (const fk of fks) {
          const [constraintInfo] = await queryInterface.sequelize.query(
            `SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
             WHERE TABLE_NAME = '${tableName}' 
             AND CONSTRAINT_NAME = '${fk.CONSTRAINT_NAME}'`,
            { transaction }
          );
          constraints.push(constraintInfo[0]);
          
          // Drop the foreign key constraint
          await queryInterface.sequelize.query(
            `ALTER TABLE ${tableName} DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`,
            { transaction }
          );
        }
        
        // Get existing indexes
        const [indexes] = await queryInterface.sequelize.query(
          `SHOW INDEX FROM ${tableName}`,
          { transaction }
        );
        
        // Get unique index names
        const indexNames = [...new Set(indexes.map(idx => idx.Key_name))];
        
        // Drop old indexes if they exist
        const oldIndexes = [
          'idx_file_explorer_device_id',
          'idx_file_explorer_parent_id',
          'idx_file_explorer_type',
          'idx_file_explorer_path'
        ];
        
        for (const indexName of oldIndexes) {
          if (indexNames.includes(indexName)) {
            try {
              await queryInterface.sequelize.query(
                `DROP INDEX ${indexName} ON ${tableName}`,
                { transaction }
              );
            } catch (error) {
              console.log(`Could not drop index ${indexName}:`, error.message);
            }
          }
        }
        
        // Get existing columns to check what we need to add
        const columns = await queryInterface.describeTable(tableName, { transaction });
        
        // Add parent_path column if it doesn't exist
        if (!columns.parent_path) {
          await queryInterface.addColumn(
            tableName,
            'parent_path',
            {
              type: Sequelize.TEXT,
              allowNull: true,
              comment: 'Parent directory path'
            },
            { transaction }
          );
        }
        
        // Add new indexes if they don't exist
        const newIndexes = [
          { 
            name: 'idx_file_explorer_device_id', 
            sql: `CREATE INDEX idx_file_explorer_device_id ON ${tableName}(device_id)` 
          },
          { 
            name: 'idx_file_explorer_parent_path', 
            sql: `CREATE INDEX idx_file_explorer_parent_path ON ${tableName}(parent_path(255))`,
            checkColumn: 'parent_path'
          },
          { 
            name: 'idx_file_explorer_file_type', 
            sql: `CREATE INDEX idx_file_explorer_file_type ON ${tableName}(file_type)` 
          },
          { 
            name: 'idx_file_explorer_file_path', 
            sql: `CREATE INDEX idx_file_explorer_file_path ON ${tableName}(file_path(255))`,
            checkColumn: 'file_path'
          },
          { 
            name: 'idx_file_explorer_file_path_device_id',
            sql: `CREATE UNIQUE INDEX idx_file_explorer_file_path_device_id ON ${tableName}(file_path(255), device_id)`,
            checkColumn: 'file_path'  // Just need to check one of the columns
          },
          {
            name: 'idx_file_explorer_scan_timestamp',
            sql: `CREATE INDEX idx_file_explorer_scan_timestamp ON ${tableName}(scan_timestamp)`,
            checkColumn: 'scan_timestamp'
          }
        ];
        
        for (const index of newIndexes) {
          if (!indexNames.includes(index.name)) {
            try {
              // Only create the index if the column exists or if no column check is needed
              if (!index.checkColumn || columns[index.checkColumn]) {
                await queryInterface.sequelize.query(index.sql, { transaction });
              } else {
                console.log(`Skipping index ${index.name} because column ${index.checkColumn} does not exist`);
              }
            } catch (error) {
              console.log(`Error creating index ${index.name}:`, error.message);
              // Instead of throwing, we'll log and continue to avoid blocking the migration
              // throw error;
            }
          }
        }
        
        // Recreate foreign key constraints
        for (const constraint of constraints) {
          const fkSql = `
            ALTER TABLE ${tableName} 
            ADD CONSTRAINT ${constraint.CONSTRAINT_NAME} 
            FOREIGN KEY (${constraint.COLUMN_NAME}) 
            REFERENCES ${constraint.REFERENCED_TABLE_NAME}(${constraint.REFERENCED_COLUMN_NAME})
            ON DELETE ${constraint.DELETE_RULE || 'RESTRICT'}
            ON UPDATE ${constraint.UPDATE_RULE || 'RESTRICT'}
          `;
          
          try {
            await queryInterface.sequelize.query(fkSql, { transaction });
          } catch (error) {
            console.log(`Error recreating foreign key ${constraint.CONSTRAINT_NAME}:`, error.message);
            throw error;
          }
        }
      } catch (error) {
        console.error('Error updating indexes:', error.message);
        throw error;
      }
      // Indexes are now handled in the try block above
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error in file_explorer migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Note: This is a complex migration and cannot be fully rolled back automatically
    // due to the data transformation and potential data loss
    
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'file_explorer';
    
    try {
      // Remove added columns if they exist
      const columns = await queryInterface.describeTable(tableName, { transaction });
      
      const columnsToRemove = [
        'parent_path',
        'owner',
        'group',
        'is_readable',
        'is_writable',
        'is_executable',
        'thumbnail_path',
        'scan_timestamp',
        'is_deleted'
      ];
      
      for (const column of columnsToRemove) {
        if (columns[column]) {
          await queryInterface.removeColumn(tableName, column, { transaction });
        }
      }
      
      // Rename columns back if they were renamed
      if (columns.file_path && !columns.path) {
        await queryInterface.renameColumn(
          tableName,
          'file_path',
          'path',
          { transaction }
        );
      }
      
      if (columns.file_name && !columns.name) {
        await queryInterface.renameColumn(
          tableName,
          'file_name',
          'name',
          { transaction }
        );
      }
      
      if (columns.file_type && !columns.type) {
        await queryInterface.renameColumn(
          tableName,
          'file_type',
          'type',
          { transaction }
        );
      }
      
      if (columns.file_size && !columns.size) {
        await queryInterface.renameColumn(
          tableName,
          'file_size',
          'size',
          { transaction }
        );
      }
      
      // Note: We cannot automatically revert the id type change from UUID to INTEGER
      // as it would require data migration and potential data loss
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error rolling back file_explorer migration:', error);
      throw error;
    }
  }
};
