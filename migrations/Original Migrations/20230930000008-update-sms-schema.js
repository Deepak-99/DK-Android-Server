'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'sms';
    
    try {
      // Check if table exists using raw SQL
      const [tables] = await queryInterface.sequelize.query(
        `SHOW TABLES LIKE '${tableName}'`,
        { transaction }
      );
      const tableExists = tables.length > 0;
      
      if (!tableExists) {
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
          sms_id: {
            type: Sequelize.STRING(100),
            allowNull: false,
            comment: 'SMS ID from Android device'
          },
          thread_id: {
            type: Sequelize.STRING(100),
            allowNull: true,
            comment: 'Conversation thread ID'
          },
          address: {
            type: Sequelize.STRING(100),
            allowNull: false,
            comment: 'Phone number or contact address'
          },
          person: {
            type: Sequelize.STRING(100),
            allowNull: true,
            comment: 'Contact person ID'
          },
          date: {
            type: Sequelize.DATE,
            allowNull: false,
            comment: 'Date SMS was sent/received'
          },
          date_sent: {
            type: Sequelize.DATE,
            allowNull: true,
            comment: 'Date SMS was sent (for sent messages)'
          },
          protocol: {
            type: Sequelize.INTEGER,
            allowNull: true
          },
          read: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          status: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Message status code'
          },
          type: {
            type: Sequelize.ENUM('inbox', 'sent', 'draft', 'outbox', 'failed', 'queued'),
            allowNull: false
          },
          reply_path_present: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          subject: {
            type: Sequelize.STRING(255),
            allowNull: true
          },
          body: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          service_center: {
            type: Sequelize.STRING(100),
            allowNull: true
          },
          locked: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          error_code: {
            type: Sequelize.INTEGER,
            allowNull: true
          },
          seen: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
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
          name: 'idx_sms_device_id',
          transaction
        });
        
        await queryInterface.addIndex(tableName, ['thread_id'], {
          name: 'idx_sms_thread_id',
          transaction
        });
        
        await queryInterface.addIndex(tableName, ['address'], {
          name: 'idx_sms_address',
          transaction
        });
        
        await queryInterface.addIndex(tableName, ['date'], {
          name: 'idx_sms_date',
          transaction
        });
        
        await transaction.commit();
        return;
      }
      
      // Table exists, check and add missing columns
      const columns = await queryInterface.describeTable(tableName, { transaction });
      
      // Add missing columns
      if (!columns.sms_id) {
        await queryInterface.addColumn(
          tableName,
          'sms_id',
          {
            type: Sequelize.STRING(100),
            allowNull: true,
            after: 'device_id',
            comment: 'SMS ID from Android device'
          },
          { transaction }
        );
        
        // Generate a unique ID for existing records
        await queryInterface.sequelize.query(
          `UPDATE ${tableName} SET sms_id = CONCAT('sms_', id)`,
          { transaction }
        );
        
        // Make the column NOT NULL after populating it
        await queryInterface.changeColumn(
          tableName,
          'sms_id',
          {
            type: Sequelize.STRING(100),
            allowNull: false
          },
          { transaction }
        );
      }
      
      if (!columns.person) {
        await queryInterface.addColumn(
          tableName,
          'person',
          {
            type: Sequelize.STRING(100),
            allowNull: true,
            after: 'address',
            comment: 'Contact person ID'
          },
          { transaction }
        );
      }
      
      if (!columns.protocol) {
        await queryInterface.addColumn(
          tableName,
          'protocol',
          {
            type: Sequelize.INTEGER,
            allowNull: true,
            after: 'date_sent'
          },
          { transaction }
        );
      }
      
      if (!columns.reply_path_present) {
        await queryInterface.addColumn(
          tableName,
          'reply_path_present',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            after: 'type'
          },
          { transaction }
        );
      }
      
      if (!columns.subject) {
        await queryInterface.addColumn(
          tableName,
          'subject',
          {
            type: Sequelize.STRING(255),
            allowNull: true,
            after: 'reply_path_present'
          },
          { transaction }
        );
      }
      
      if (!columns.locked) {
        await queryInterface.addColumn(
          tableName,
          'locked',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            after: 'service_center'
          },
          { transaction }
        );
      }
      
      if (!columns.error_code) {
        await queryInterface.addColumn(
          tableName,
          'error_code',
          {
            type: Sequelize.INTEGER,
            allowNull: true,
            after: 'locked'
          },
          { transaction }
        );
      }
      
      if (!columns.seen) {
        await queryInterface.addColumn(
          tableName,
          'seen',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            after: 'error_code'
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
            after: 'seen'
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
      
      // Change thread_id from INTEGER to STRING if needed
      if (columns.thread_id && columns.thread_id.type === 'int') {
        // Create a temporary table with the new schema
        const tempTableName = `${tableName}_new`;
        await queryInterface.createTable(tempTableName, {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          device_id: {
            type: Sequelize.STRING(255),
            allowNull: false,
            references: {
              model: 'Devices', // Match Sequelize model name
              key: 'device_id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          sms_id: {
            type: Sequelize.STRING(100),
            allowNull: false,
            comment: 'SMS ID from Android device'
          },
          thread_id: {
            type: Sequelize.STRING(100),
            allowNull: true,
            comment: 'Conversation thread ID'
          },
          address: {
            type: Sequelize.STRING(100),
            allowNull: false,
            comment: 'Phone number or contact address'
          },
          person: {
            type: Sequelize.STRING(100),
            allowNull: true,
            comment: 'Contact person ID'
          },
          date: {
            type: Sequelize.DATE,
            allowNull: false,
            comment: 'Date SMS was sent/received'
          },
          date_sent: {
            type: Sequelize.DATE,
            allowNull: true,
            comment: 'Date SMS was sent (for sent messages)'
          },
          protocol: {
            type: Sequelize.INTEGER,
            allowNull: true
          },
          read: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          status: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Message status code'
          },
          type: {
            type: Sequelize.ENUM('inbox', 'sent', 'draft', 'outbox', 'failed', 'queued'),
            allowNull: false
          },
          reply_path_present: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          subject: {
            type: Sequelize.STRING(255),
            allowNull: true
          },
          body: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          service_center: {
            type: Sequelize.STRING(100),
            allowNull: true
          },
          locked: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          error_code: {
            type: Sequelize.INTEGER,
            allowNull: true
          },
          seen: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
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
          `INSERT INTO "${tempTableName}" 
           (id, device_id, sms_id, thread_id, address, person, body, type, 
            read, date, date_sent, service_center, status, reply_path_present, 
            subject, locked, error_code, seen, sync_timestamp, is_deleted, created_at, updated_at)
           SELECT 
             id,
             device_id, 
             COALESCE(sms_id, CONCAT('sms_', id)) as sms_id,
             CAST(thread_id AS VARCHAR(100)) as thread_id,
             address,
             person,
             body,
             type,
             COALESCE(read, false) as read,
             date,
             date_sent,
             service_center,
             status,
             COALESCE(reply_path_present, false) as reply_path_present,
             subject,
             COALESCE(locked, false) as locked,
             error_code,
             COALESCE(seen, false) as seen,
             COALESCE(sync_timestamp, NOW()) as sync_timestamp,
             COALESCE(is_deleted, false) as is_deleted,
             created_at,
             COALESCE(updated_at, NOW()) as updated_at
           FROM "${tableName}"`,
          { transaction }
        );
        
        // Drop old table and rename new one
        await queryInterface.dropTable(tableName, { transaction });
        await queryInterface.renameTable(tempTableName, tableName, { transaction });
      }
      
      // Add any missing indexes
      const indexes = await queryInterface.showIndex(tableName, { transaction });
      
      if (!indexes.some(idx => idx.name === 'idx_sms_sms_id')) {
        await queryInterface.addIndex(
          tableName, 
          ['sms_id'],
          {
            name: 'idx_sms_sms_id',
            unique: true,
            transaction
          }
        );
      }
      
      if (!indexes.some(idx => idx.name === 'idx_sms_type')) {
        await queryInterface.addIndex(
          tableName, 
          ['type'],
          {
            name: 'idx_sms_type',
            transaction
          }
        );
      }
      
      if (!indexes.some(idx => idx.name === 'idx_sms_is_deleted')) {
        await queryInterface.addIndex(
          tableName, 
          ['is_deleted'],
          {
            name: 'idx_sms_is_deleted',
            transaction
          }
        );
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error in SMS migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'SMS';
    
    try {
      // Check if table exists
      const tables = await queryInterface.showAllTables();
      if (!tables.includes(tableName)) {
        console.log(`Table ${tableName} does not exist, nothing to rollback`);
        await transaction.commit();
        return;
      }
      
      // Get current table structure
      const columns = await queryInterface.describeTable(tableName, { transaction });
      
      // Remove added columns if they exist
      const columnsToRemove = [
        'sms_id', 'person', 'protocol', 'reply_path_present', 'subject',
        'locked', 'error_code', 'seen', 'sync_timestamp', 'is_deleted'
      ];
      
      for (const column of columnsToRemove) {
        if (columns[column]) {
          await queryInterface.removeColumn(tableName, column, { transaction });
        }
      }
      
      // Remove added indexes
      const indexes = await queryInterface.showIndex(tableName, { transaction });
      const indexesToRemove = [
        'idx_sms_sms_id', 'idx_sms_type', 'idx_sms_is_deleted'
      ];
      
      for (const index of indexesToRemove) {
        if (indexes.some(idx => idx.name === index)) {
          await queryInterface.removeIndex(tableName, index, { transaction });
        }
      }
      
      // Drop ENUM types if they exist (PostgreSQL specific)
      if (queryInterface.sequelize.options.dialect === 'postgres') {
        await queryInterface.sequelize.query(
          'DROP TYPE IF EXISTS "enum_SMS_type" CASCADE',
          { transaction }
        );
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error rolling back SMS migration:', error);
      throw error;
    }
  }
};
