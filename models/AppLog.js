const { DataTypes } = require('sequelize');
const logger = require('../utils/logger');

module.exports = (sequelize) => {
  const AppLog = sequelize.define('AppLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    deviceId: {
      type: DataTypes.STRING,
      field: 'deviceId',
      allowNull: false,
      references: {
        model: 'devices',
        key: 'deviceId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      comment: 'Reference to devices table (deviceId)'
    },
    appPackage: {
      type: DataTypes.STRING,
      field: 'app_package',
      allowNull: false,
      comment: 'Package name of the app'
    },
    appName: {
      type: DataTypes.STRING,
      field: 'app_name',
      allowNull: true,
      comment: 'Display name of the app'
    },
    logLevel: {
      type: DataTypes.ENUM('verbose', 'debug', 'info', 'warn', 'error', 'assert'),
      field: 'log_level',
      allowNull: false
    },
    tag: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Log tag'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Log message content'
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    threadId: {
      type: DataTypes.STRING,
      field: 'thread_id',
      allowNull: true
    },
    processId: {
      type: DataTypes.INTEGER,
      field: 'process_id',
      allowNull: true
    },
    stackTrace: {
      type: DataTypes.TEXT,
      field: 'stack_trace',
      allowNull: true,
      comment: 'Stack trace for errors'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional log metadata'
    }
  }, {
    tableName: 'app_logs',
    timestamps: false,
    indexes: [
      {
        fields: ['deviceId'],
        name: 'idx_app_logs_device_id'
      },
      {
        fields: [
          { name: 'app_package' }  // Use database column name with object format
        ],
        name: 'idx_app_logs_app_package'
      },
      {
        fields: ['timestamp'],
        name: 'idx_app_logs_timestamp'
      },
      // Add a composite index for common query patterns
      {
        fields: [
          { name: 'app_package' },  // Use database column name with object format
          'timestamp'
        ],
        name: 'idx_app_logs_package_timestamp'
      }
    ]
  });

  return AppLog;
};
