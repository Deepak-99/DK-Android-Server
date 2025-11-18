/**
 * Application constants
 */

// User roles
const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  DEVICE: 'device',
  GUEST: 'guest'
};

// Command types
const COMMAND_TYPES = {
  // Device control
  REBOOT: 'reboot',
  LOCK_DEVICE: 'lock_device',
  WIPE_DATA: 'wipe_data',
  
  // Information gathering
  GET_DEVICE_INFO: 'get_device_info',
  GET_APPS: 'get_apps',
  GET_CONTACTS: 'get_contacts',
  GET_SMS: 'get_sms',
  GET_CALL_LOGS: 'get_call_logs',
  GET_LOCATION: 'get_location',
  
  // Media
  TAKE_PHOTO: 'take_photo',
  RECORD_AUDIO: 'record_audio',
  RECORD_VIDEO: 'record_video',
  
  // Remote control
  EXECUTE_SHELL: 'execute_shell',
  SEND_SMS: 'send_sms',
  MAKE_CALL: 'make_call',
  
  // App update
  CHECK_UPDATE: 'check_update',
  DOWNLOAD_UPDATE: 'download_update',
  INSTALL_UPDATE: 'install_update'
};

// Command statuses
const COMMAND_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  TIMED_OUT: 'timed_out'
};

// Device statuses
const DEVICE_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  DISABLED: 'disabled',
  MAINTENANCE: 'maintenance'
};

// Update channels
const UPDATE_CHANNELS = {
  STABLE: 'stable',
  BETA: 'beta',
  ALPHA: 'alpha',
  DEV: 'dev'
};

// File types
const FILE_TYPES = {
  APK: 'application/vnd.android.package-archive',
  IMAGE: 'image/*',
  AUDIO: 'audio/*',
  VIDEO: 'video/*',
  DOCUMENT: 'application/*',
  ARCHIVE: 'application/zip,application/x-rar-compressed,application/x-7z-compressed',
  OTHER: 'other'
};

// Log levels
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  TRACE: 'trace'
};

// Export all constants
module.exports = {
  ROLES,
  COMMAND_TYPES,
  COMMAND_STATUS,
  DEVICE_STATUS,
  UPDATE_CHANNELS,
  FILE_TYPES,
  LOG_LEVELS
};
