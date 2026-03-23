const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('AppLog', {

      id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
      },

      deviceId: {
          type: DataTypes.STRING,
          allowNull: false,
          field: 'device_id',
          references: {
              model: 'devices',
              key: 'device_id'
          }
      },

      appPackage: {
          type: DataTypes.STRING,
          field: 'app_package',
          allowNull: false
      },

      appName: {
          type: DataTypes.STRING,
          field: 'app_name'
      },

      logLevel: {
          type: DataTypes.ENUM('verbose', 'debug', 'info', 'warn', 'error', 'assert'),
          field: 'log_level',
          allowNull: false
      },

      tag: DataTypes.STRING,

      message: {
          type: DataTypes.TEXT,
          allowNull: false
      },

      timestamp: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
      },

      threadId: {
          type: DataTypes.STRING,
          field: 'thread_id'
      },

      processId: {
          type: DataTypes.INTEGER,
          field: 'process_id'
      },

      stackTrace: {
          type: DataTypes.TEXT,
          field: 'stack_trace'
      },

      metadata: DataTypes.JSON

  }, {
      tableName: 'app_logs',
      timestamps: false,
      underscored: true,
      indexes: [
          {fields: ['device_id']},
          {fields: ['app_package']},
          {fields: ['timestamp']}
      ]
  });
};