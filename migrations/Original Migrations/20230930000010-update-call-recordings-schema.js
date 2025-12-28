'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'call_recordings';
    
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
              key: 'device_id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: 'Reference to devices table (deviceId)'
          },
          call_log_id: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: 'call_logs',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            comment: 'Reference to associated call log entry'
          },
          phone_number: {
            type: Sequelize.STRING(50),
            allowNull: false,
            comment: 'Phone number of the call'
          },
          contact_name: {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: 'Contact name if available'
          },
          call_type: {
            type: Sequelize.ENUM('incoming', 'outgoing', 'missed', 'rejected', 'blocked'),
            allowNull: false,
            comment: 'Type of call'
          },
          call_start_time: {
            type: Sequelize.DATE,
            allowNull: false,
            comment: 'When the call started'
          },
          call_end_time: {
            type: Sequelize.DATE,
            allowNull: true,
            comment: 'When the call ended'
          },
          call_duration: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Call duration in seconds'
          },
          recording_file_path: {
            type: Sequelize.TEXT,
            allowNull: false,
            comment: 'Path to the recorded call file on server'
          },
          recording_file_name: {
            type: Sequelize.STRING(255),
            allowNull: false,
            comment: 'Original filename of the recording'
          },
          recording_file_size: {
            type: Sequelize.BIGINT,
            allowNull: true,
            comment: 'Size of recording file in bytes'
          },
          recording_duration: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Duration of recording in seconds'
          },
          recording_format: {
            type: Sequelize.STRING(10),
            allowNull: false,
            defaultValue: 'mp3',
            comment: 'Audio format (mp3, wav, m4a, etc.)'
          },
          recording_quality: {
            type: Sequelize.ENUM('low', 'medium', 'high'),
            allowNull: false,
            defaultValue: 'medium',
            comment: 'Recording quality'
          },
          recording_source: {
            type: Sequelize.ENUM('microphone', 'voice_call', 'voice_communication', 'voice_recognition'),
            allowNull: true,
            comment: 'Audio source used for recording'
          },
          transcription: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Transcription of the call if available'
          },
          status: {
            type: Sequelize.ENUM('recording', 'completed', 'failed', 'deleted'),
            defaultValue: 'completed'
          },
          metadata: {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'Additional metadata in JSON format'
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
          name: 'idx_call_recordings_device_id',
          transaction
        });
        
        await queryInterface.addIndex(tableName, ['call_log_id'], {
          name: 'idx_call_recordings_call_log_id',
          transaction
        });
        
        await queryInterface.addIndex(tableName, ['phone_number'], {
          name: 'idx_call_recordings_phone_number',
          transaction
        });
        
        await queryInterface.addIndex(tableName, ['call_start_time'], {
          name: 'idx_call_recordings_call_start_time',
          transaction
        });
        
        await transaction.commit();
        return;
      }
      
      // Table exists, check and add missing columns
      const tableColumns = await queryInterface.describeTable(tableName, { transaction });
      
      // Rename columns if they exist
      if (tableColumns.recording_start && !tableColumns.call_start_time) {
        await queryInterface.renameColumn(
          tableName,
          'recording_start',
          'call_start_time',
          { transaction }
        );
      }
      
      if (tableColumns.recording_end && !tableColumns.call_end_time) {
        await queryInterface.renameColumn(
          tableName,
          'recording_end',
          'call_end_time',
          { transaction }
        );
      }
      
      if (tableColumns.duration && !tableColumns.call_duration) {
        await queryInterface.renameColumn(
          tableName,
          'duration',
          'call_duration',
          { transaction }
        );
      }
      
      if (tableColumns.file_path && !tableColumns.recording_file_path) {
        await queryInterface.renameColumn(
          tableName,
          'file_path',
          'recording_file_path',
          { transaction }
        );
      }
      
      if (tableColumns.file_size && !tableColumns.recording_file_size) {
        await queryInterface.renameColumn(
          tableName,
          'file_size',
          'recording_file_size',
          { transaction }
        );
      }
      
      if (tableColumns.format && !tableColumns.recording_format) {
        await queryInterface.renameColumn(
          tableName,
          'format',
          'recording_format',
          { transaction }
        );
      }
      
      // Add missing columns
if (!tableColumns.recording_file_name) {
        await queryInterface.addColumn(
          tableName,
          'recording_file_name',
          {
            type: Sequelize.STRING(255),
            allowNull: true,
            after: 'recording_file_path',
            comment: 'Original filename of the recording'
          },
          { transaction }
        );
        
        // Populate with default values based on file_path
        await queryInterface.sequelize.query(
          `UPDATE ${tableName} SET recording_file_name = SUBSTRING_INDEX(recording_file_path, '/', -1) 
           WHERE recording_file_name IS NULL`,
          { transaction }
        );
        
        // Make the column NOT NULL after populating it
        await queryInterface.changeColumn(
          tableName,
          'recording_file_name',
          {
            type: Sequelize.STRING(255),
            allowNull: false
          },
          { transaction }
        );
      }
      
if (!tableColumns.recording_duration) {
        await queryInterface.addColumn(
          tableName,
          'recording_duration',
          {
            type: Sequelize.INTEGER,
            allowNull: true,
            after: 'call_duration',
            comment: 'Duration of recording in seconds'
          },
          { transaction }
        );
        
        // Copy call_duration to recording_duration
        await queryInterface.sequelize.query(
          `UPDATE ${tableName} SET recording_duration = call_duration`,
          { transaction }
        );
      }
      
      if (!tableColumns.recording_quality) {
        await queryInterface.addColumn(
          tableName,
          'recording_quality',
          {
            type: Sequelize.ENUM('low', 'medium', 'high'),
            allowNull: false,
            defaultValue: 'medium',
            after: 'recording_format',
            comment: 'Recording quality'
          },
          { transaction }
        );
      }
      
      if (!tableColumns.recording_source) {
        await queryInterface.addColumn(
          tableName,
          'recording_source',
          {
            type: Sequelize.ENUM('microphone', 'voice_call', 'voice_communication', 'voice_recognition'),
            allowNull: true,
            after: 'recording_quality',
            comment: 'Audio source used for recording'
          },
          { transaction }
        );
      }
      
      if (!tableColumns.transcription) {
        await queryInterface.addColumn(
          tableName,
          'transcription',
          {
            type: Sequelize.TEXT,
            allowNull: true,
            after: 'recording_source',
            comment: 'Transcription of the call if available'
          },
          { transaction }
        );
      }
      
      if (!tableColumns.is_deleted) {
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
      
      // Change call_log_id from INTEGER to UUID if needed
      if (tableColumns.call_log_id && tableColumns.call_log_id.type === 'int unsigned') {
        // First, drop the foreign key constraint
        const constraints = await queryInterface.sequelize.query(
          `SELECT CONSTRAINT_NAME 
           FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
           WHERE TABLE_NAME = '${tableName}' 
           AND COLUMN_NAME = 'call_log_id' 
           AND REFERENCED_TABLE_NAME IS NOT NULL`,
          { transaction }
        );
        
        if (constraints[0].length > 0) {
          const constraintName = constraints[0][0].CONSTRAINT_NAME;
          await queryInterface.removeConstraint(tableName, constraintName, { transaction });
        }
        
        // Change the column type to STRING temporarily
        await queryInterface.changeColumn(
          tableName,
          'call_log_id',
          {
            type: Sequelize.STRING(36),
            allowNull: true
          },
          { transaction }
        );
        
        // Then change it to UUID
        await queryInterface.changeColumn(
          tableName,
          'call_log_id',
          {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: 'call_logs',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            comment: 'Reference to associated call log entry'
          },
          { transaction }
        );
      }
      
      // Update ENUM values for call_type if needed
      const tableInfo = await queryInterface.sequelize.query(
        `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'call_type'`,
        {
          replacements: [queryInterface.sequelize.config.database, tableName],
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      
      if (tableInfo.length > 0) {
        const enumValues = tableInfo[0].COLUMN_TYPE
          .replace(/^enum\(|'|\)$/g, '')
          .split("','");
          
        if (!enumValues.includes('missed') || !enumValues.includes('rejected') || !enumValues.includes('blocked')) {
          // Add the missing ENUM values
          await queryInterface.sequelize.query(
            `ALTER TABLE ${tableName} 
             MODIFY COLUMN call_type ENUM('incoming', 'outgoing', 'missed', 'rejected', 'blocked', 'conference')`,
            { transaction }
          );
        }
      }
      
      // Add status column if it doesn't exist
      const [columns] = await queryInterface.sequelize.query(
        `SHOW COLUMNS FROM ${tableName} LIKE 'status'`,
        { transaction }
      );
      
      if (columns.length === 0) {
        await queryInterface.addColumn(
          tableName,
          'status',
          {
            type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'),
            defaultValue: 'pending',
            allowNull: false,
            comment: 'Status of the recording processing'
          },
          { transaction }
        );
      }
      
      // Add any missing indexes
      const indexes = await queryInterface.showIndex(tableName, { transaction });
      
      if (!indexes.some(idx => idx.name === 'idx_call_recordings_call_start_time')) {
        await queryInterface.addIndex(
          tableName, 
          ['call_start_time'],
          {
            name: 'idx_call_recordings_call_start_time',
            transaction
          }
        );
      }
      
      if (!indexes.some(idx => idx.name === 'idx_call_recordings_status')) {
        await queryInterface.addIndex(
          tableName, 
          ['status'],
          {
            name: 'idx_call_recordings_status',
            transaction
          }
        );
      }
      
      // Add is_deleted column if it doesn't exist
      const [isDeletedColumns] = await queryInterface.sequelize.query(
        `SHOW COLUMNS FROM ${tableName} LIKE 'is_deleted'`,
        { transaction }
      );
      
      if (isDeletedColumns.length === 0) {
        await queryInterface.addColumn(
          tableName,
          'is_deleted',
          {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false
          },
          { transaction }
        );
      }
      
      if (!indexes.some(idx => idx.name === 'idx_call_recordings_is_deleted')) {
        await queryInterface.addIndex(
          tableName, 
          ['is_deleted'],
          {
            name: 'idx_call_recordings_is_deleted',
            transaction
          }
        );
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error in call_recordings migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Note: This is a complex migration and cannot be fully rolled back automatically
    // due to the data type changes and potential data loss
    
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'call_recordings';
    
    try {
      // Rename columns back if they were renamed
      const tableColumns = await queryInterface.describeTable(tableName, { transaction });
      
      if (tableColumns.call_start_time && !tableColumns.recording_start) {
        await queryInterface.renameColumn(
          tableName,
          'call_start_time',
          'recording_start',
          { transaction }
        );
      }
      
      if (tableColumns.call_end_time && !tableColumns.recording_end) {
        await queryInterface.renameColumn(
          tableName,
          'call_end_time',
          'recording_end',
          { transaction }
        );
      }
      
      if (tableColumns.call_duration && !tableColumns.duration) {
        await queryInterface.renameColumn(
          tableName,
          'call_duration',
          'duration',
          { transaction }
        );
      }
      
      if (tableColumns.recording_file_path && !tableColumns.file_path) {
        await queryInterface.renameColumn(
          tableName,
          'recording_file_path',
          'file_path',
          { transaction }
        );
      }
      
      if (tableColumns.recording_file_size && !tableColumns.file_size) {
        await queryInterface.renameColumn(
          tableName,
          'recording_file_size',
          'file_size',
          { transaction }
        );
      }
      
      if (tableColumns.recording_format && !tableColumns.format) {
        await queryInterface.renameColumn(
          tableName,
          'recording_format',
          'format',
          { transaction }
        );
      }
      
      // Remove added columns
      if (tableColumns.recording_file_name) {
        await queryInterface.removeColumn(tableName, 'recording_file_name', { transaction });
      }
      
      if (tableColumns.recording_duration) {
        await queryInterface.removeColumn(tableName, 'recording_duration', { transaction });
      }
      
      if (tableColumns.recording_quality && !tableColumns.quality) {
        await queryInterface.removeColumn(tableName, 'recording_quality', { transaction });
      }
      
      if (tableColumns.recording_source && !tableColumns.source) {
        await queryInterface.removeColumn(tableName, 'recording_source', { transaction });
      }
      
      if (tableColumns.transcription && !tableColumns.transcription_text) {
        await queryInterface.removeColumn(tableName, 'transcription', { transaction });
      }
      
      if (tableColumns.is_deleted) {
        await queryInterface.removeColumn(tableName, 'is_deleted', { transaction });
      }
      
      // Remove added indexes
      const indexes = await queryInterface.showIndex(tableName, { transaction });
      
      if (indexes.some(idx => idx.name === 'idx_call_recordings_call_start_time')) {
        await queryInterface.removeIndex(tableName, 'idx_call_recordings_call_start_time', { transaction });
      }
      
      if (indexes.some(idx => idx.name === 'idx_call_recordings_status')) {
        await queryInterface.removeIndex(tableName, 'idx_call_recordings_status', { transaction });
      }
      
      if (indexes.some(idx => idx.name === 'idx_call_recordings_is_deleted')) {
        await queryInterface.removeIndex(tableName, 'idx_call_recordings_is_deleted', { transaction });
      }
      
      // Note: We cannot automatically revert the call_log_id type change from UUID to INTEGER
      // as it would require data migration and potential data loss
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error rolling back call_recordings migration:', error);
      throw error;
    }
  }
};
