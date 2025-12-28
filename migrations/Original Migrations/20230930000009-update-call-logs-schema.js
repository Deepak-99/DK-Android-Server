'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'call_logs';
    
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
          call_id: {
            type: Sequelize.STRING(100),
            allowNull: false,
            comment: 'Call ID from Android device'
          },
          number: {
            type: Sequelize.STRING(100),
            allowNull: false,
            comment: 'Phone number'
          },
          name: {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: 'Contact name if available'
          },
          date: {
            type: Sequelize.DATE,
            allowNull: false,
            comment: 'Date and time of call'
          },
          duration: {
            type: Sequelize.INTEGER,
            allowNull: false,
            comment: 'Call duration in seconds'
          },
          type: {
            type: Sequelize.ENUM('incoming', 'outgoing', 'missed', 'voicemail', 'rejected', 'blocked'),
            allowNull: false
          },
          number_type: {
            type: Sequelize.STRING(50),
            allowNull: true,
            comment: 'Type of number (mobile, home, work, etc.)'
          },
          number_label: {
            type: Sequelize.STRING(100),
            allowNull: true
          },
          country_iso: {
            type: Sequelize.STRING(10),
            allowNull: true,
            comment: 'Country ISO code'
          },
          data_usage: {
            type: Sequelize.BIGINT,
            allowNull: true,
            comment: 'Data usage in bytes'
          },
          features: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Call features bitmask'
          },
          geocoded_location: {
            type: Sequelize.STRING(255),
            allowNull: true
          },
          is_read: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          new: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
          },
          phone_account_id: {
            type: Sequelize.STRING(100),
            allowNull: true
          },
          via_number: {
            type: Sequelize.STRING(100),
            allowNull: true
          },
          sync_timestamp: {
            type: Sequelize.DATE,
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
        
        // Add indexes
        await queryInterface.addIndex(tableName, ['device_id'], {
          name: 'idx_call_logs_device_id',
          transaction
        });
        
        await queryInterface.addIndex(tableName, ['call_id'], {
          name: 'idx_call_logs_call_id',
          unique: true,
          transaction
        });
        
        await queryInterface.addIndex(tableName, ['number'], {
          name: 'idx_call_logs_number',
          transaction
        });
        
        await queryInterface.addIndex(tableName, ['date'], {
          name: 'idx_call_logs_date',
          transaction
        });
        
        await queryInterface.addIndex(tableName, ['type'], {
          name: 'idx_call_logs_type',
          transaction
        });
        
        await transaction.commit();
        return;
      }
      
      // Table exists, check and add missing columns
      const columns = await queryInterface.describeTable(tableName, { transaction });
      
      // Add missing columns
      if (!columns.call_id) {
        await queryInterface.addColumn(
          tableName,
          'call_id',
          {
            type: Sequelize.STRING(100),
            allowNull: true,
            after: 'device_id',
            comment: 'Call ID from Android device'
          },
          { transaction }
        );
        
        // Generate a unique ID for existing records
        await queryInterface.sequelize.query(
          `UPDATE ${tableName} SET call_id = CONCAT('call_', id)`,
          { transaction }
        );
        
        // Make the column NOT NULL after populating it
        await queryInterface.changeColumn(
          tableName,
          'call_id',
          {
            type: Sequelize.STRING(100),
            allowNull: false
          },
          { transaction }
        );
      }
      
      if (!columns.number_type) {
        await queryInterface.addColumn(
          tableName,
          'number_type',
          {
            type: Sequelize.STRING(50),
            allowNull: true,
            after: 'type',
            comment: 'Type of number (mobile, home, work, etc.)'
          },
          { transaction }
        );
      }
      
      if (!columns.number_label) {
        await queryInterface.addColumn(
          tableName,
          'number_label',
          {
            type: Sequelize.STRING(100),
            allowNull: true,
            after: 'number_type'
          },
          { transaction }
        );
      }
      
      if (!columns.country_iso) {
        await queryInterface.addColumn(
          tableName,
          'country_iso',
          {
            type: Sequelize.STRING(10),
            allowNull: true,
            after: 'number_label',
            comment: 'Country ISO code'
          },
          { transaction }
        );
      }
      
      if (!columns.data_usage) {
        await queryInterface.addColumn(
          tableName,
          'data_usage',
          {
            type: Sequelize.BIGINT,
            allowNull: true,
            after: 'country_iso',
            comment: 'Data usage in bytes'
          },
          { transaction }
        );
      }
      
      if (!columns.features) {
        await queryInterface.addColumn(
          tableName,
          'features',
          {
            type: Sequelize.INTEGER,
            allowNull: true,
            after: 'data_usage',
            comment: 'Call features bitmask'
          },
          { transaction }
        );
      }
      
      if (!columns.new) {
        await queryInterface.addColumn(
          tableName,
          'new',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            after: 'is_read'
          },
          { transaction }
        );
      }
      
      if (!columns.phone_account_id) {
        await queryInterface.addColumn(
          tableName,
          'phone_account_id',
          {
            type: Sequelize.STRING(100),
            allowNull: true,
            after: 'new'
          },
          { transaction }
        );
      }
      
      if (!columns.via_number) {
        await queryInterface.addColumn(
          tableName,
          'via_number',
          {
            type: Sequelize.STRING(100),
            allowNull: true,
            after: 'phone_account_id'
          },
          { transaction }
        );
      }
      
      if (!columns.sync_timestamp) {
        await queryInterface.addColumn(
          tableName,
          'sync_timestamp',
          {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            after: 'via_number'
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
            after: 'sync_timestamp'
          },
          { transaction }
        );
      }
      
      // Rename contact_name to name if it exists and name doesn't
      if (columns.contact_name && !columns.name) {
        await queryInterface.renameColumn(
          tableName,
          'contact_name',
          'name',
          { transaction }
        );
      }
      
      // Change id from INTEGER to UUID if needed
      if (columns.id && columns.id.type === 'int unsigned') {
        // Create a temporary table with the new schema
        await queryInterface.createTable('call_logs_new', {
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
          call_id: {
            type: Sequelize.STRING(100),
            allowNull: false,
            comment: 'Call ID from Android device'
          },
          number: {
            type: Sequelize.STRING(100),
            allowNull: false,
            comment: 'Phone number'
          },
          name: {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: 'Contact name if available'
          },
          date: {
            type: Sequelize.DATE,
            allowNull: false,
            comment: 'Date and time of call'
          },
          duration: {
            type: Sequelize.INTEGER,
            allowNull: false,
            comment: 'Call duration in seconds'
          },
          type: {
            type: Sequelize.ENUM('incoming', 'outgoing', 'missed', 'voicemail', 'rejected', 'blocked'),
            allowNull: false
          },
          number_type: {
            type: Sequelize.STRING(50),
            allowNull: true,
            comment: 'Type of number (mobile, home, work, etc.)'
          },
          number_label: {
            type: Sequelize.STRING(100),
            allowNull: true
          },
          country_iso: {
            type: Sequelize.STRING(10),
            allowNull: true,
            comment: 'Country ISO code'
          },
          data_usage: {
            type: Sequelize.BIGINT,
            allowNull: true,
            comment: 'Data usage in bytes'
          },
          features: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Call features bitmask'
          },
          geocoded_location: {
            type: Sequelize.STRING(255),
            allowNull: true
          },
          is_read: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          new: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
          },
          phone_account_id: {
            type: Sequelize.STRING(100),
            allowNull: true
          },
          via_number: {
            type: Sequelize.STRING(100),
            allowNull: true
          },
          sync_timestamp: {
            type: Sequelize.DATE,
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
          `INSERT INTO call_logs_new 
           (id, device_id, call_id, number, name, date, duration, type, 
            number_type, number_label, country_iso, data_usage, features, 
            geocoded_location, is_read, new, phone_account_id, via_number, 
            sync_timestamp, is_deleted, created_at, updated_at)
           SELECT 
             UUID() as id, 
             device_id, 
             CONCAT('call_', id) as call_id,
             number,
             COALESCE(contact_name, NULL) as name,
             date,
             COALESCE(duration, 0) as duration,
             type,
             NULL as number_type,
             NULL as number_label,
             NULL as country_iso,
             NULL as data_usage,
             NULL as features,
             geocoded_location,
             COALESCE(is_read, false) as is_read,
             true as new,
             NULL as phone_account_id,
             NULL as via_number,
             NOW() as sync_timestamp,
             false as is_deleted,
             created_at,
             updated_at
           FROM call_logs`,
          { transaction }
        );
        
        // Drop old table and rename new one
        await queryInterface.dropTable('call_logs', { transaction });
        await queryInterface.renameTable('call_logs_new', 'call_logs', { transaction });
      }
      
      // Add any missing indexes
      const indexes = await queryInterface.showIndex(tableName, { transaction });
      
      if (!indexes.some(idx => idx.name === 'idx_call_logs_call_id')) {
        await queryInterface.addIndex(
          tableName, 
          ['call_id'],
          {
            name: 'idx_call_logs_call_id',
            unique: true,
            transaction
          }
        );
      }
      
      if (!indexes.some(idx => idx.name === 'idx_call_logs_is_deleted')) {
        await queryInterface.addIndex(
          tableName, 
          ['is_deleted'],
          {
            name: 'idx_call_logs_is_deleted',
            transaction
          }
        );
      }
      
      // Update ENUM values if needed
      const tableInfo = await queryInterface.sequelize.query(
        `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'type'`,
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
          
        if (!enumValues.includes('voicemail')) {
          // Add the missing ENUM value
          await queryInterface.sequelize.query(
            `ALTER TABLE ${tableName} 
             MODIFY COLUMN type ENUM('incoming', 'outgoing', 'missed', 'voicemail', 'rejected', 'blocked') NOT NULL`,
            { transaction }
          );
        }
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error in call_logs migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Note: This is a complex migration and cannot be fully rolled back automatically
    // due to the data migration from INT to UUID primary key
    // A full database restore would be needed to properly revert this
    
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'call_logs';
    
    try {
      // Remove added columns if they exist
      const columns = await queryInterface.describeTable(tableName, { transaction });
      
      if (columns.call_id) {
        await queryInterface.removeColumn(tableName, 'call_id', { transaction });
      }
      
      if (columns.number_type) {
        await queryInterface.removeColumn(tableName, 'number_type', { transaction });
      }
      
      if (columns.number_label) {
        await queryInterface.removeColumn(tableName, 'number_label', { transaction });
      }
      
      if (columns.country_iso) {
        await queryInterface.removeColumn(tableName, 'country_iso', { transaction });
      }
      
      if (columns.data_usage) {
        await queryInterface.removeColumn(tableName, 'data_usage', { transaction });
      }
      
      if (columns.features) {
        await queryInterface.removeColumn(tableName, 'features', { transaction });
      }
      
      if (columns.new) {
        await queryInterface.removeColumn(tableName, 'new', { transaction });
      }
      
      if (columns.phone_account_id) {
        await queryInterface.removeColumn(tableName, 'phone_account_id', { transaction });
      }
      
      if (columns.via_number) {
        await queryInterface.removeColumn(tableName, 'via_number', { transaction });
      }
      
      if (columns.sync_timestamp) {
        await queryInterface.removeColumn(tableName, 'sync_timestamp', { transaction });
      }
      
      if (columns.is_deleted) {
        await queryInterface.removeColumn(tableName, 'is_deleted', { transaction });
      }
      
      // Rename name back to contact_name if it was renamed
      if (columns.name && !columns.contact_name) {
        await queryInterface.renameColumn(
          tableName,
          'name',
          'contact_name',
          { transaction }
        );
      }
      
      // Remove added indexes
      const indexes = await queryInterface.showIndex(tableName, { transaction });
      
      if (indexes.some(idx => idx.name === 'idx_call_logs_call_id')) {
        await queryInterface.removeIndex(tableName, 'idx_call_logs_call_id', { transaction });
      }
      
      if (indexes.some(idx => idx.name === 'idx_call_logs_is_deleted')) {
        await queryInterface.removeIndex(tableName, 'idx_call_logs_is_deleted', { transaction });
      }
      
      // Note: We cannot automatically revert the ID type change from UUID to INTEGER
      // as it would require data migration and potential data loss
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error rolling back call_logs migration:', error);
      throw error;
    }
  }
};
