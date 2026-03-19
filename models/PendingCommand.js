const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PendingCommand = sequelize.define('PendingCommand', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'deviceId',
      references: {
        model: 'devices',
        key: 'deviceId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      comment: 'Reference to devices table (deviceId)'
    },
    commandType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    commandData: {
      type: DataTypes.JSON,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'delivered', 'failed'),
      defaultValue: 'pending'
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at'  // Explicitly map to the database column name
    },
    retryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    maxRetries: {
      type: DataTypes.INTEGER,
      defaultValue: 3
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'pending_commands',
    timestamps: true,
    underscored: false,
    indexes: [
      {
        name: 'idx_pending_commands_deviceId',
        fields: ['deviceId']
      },
      {
        name: 'idx_pending_commands_status',
        fields: ['status']
      },
      {
        name: 'idx_pending_commands_created_at',
        fields: ['created_at']
      },
      {
        name: 'idx_pending_commands_device_status',
        fields: ['deviceId', 'status']
      },
      {
        name: 'idx_pending_commands_expires_at',
        fields: ['expiresAt']
      },
      {
        name: 'idx_pending_commands_priority',
        fields: ['priority']
      }
    ]
  });

  PendingCommand.associate = function(models) {
    PendingCommand.belongsTo(models.Device, {
      foreignKey: 'deviceId',
      targetKey: 'deviceId',
      as: 'device'
    });
  };

  return PendingCommand;
};
