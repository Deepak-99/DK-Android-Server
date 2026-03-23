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
      field: 'device_id'
    },

    commandType: {
      type: DataTypes.STRING,
      field: 'command_type',
      allowNull: false
    },

    commandData: {
      type: DataTypes.JSON,
      field: 'command_data'
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
      field: 'expires_at'
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
    }

  }, {
    tableName: 'pending_commands',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['device_id'] },
      { fields: ['status'] },
      { fields: ['created_at'] },
      { fields: ['device_id', 'status'] },
      { fields: ['expires_at'] },
      { fields: ['priority'] }
    ]
  });

  PendingCommand.associate = (models) => {
    PendingCommand.belongsTo(models.Device, {
      foreignKey: 'deviceId',
      targetKey: 'deviceId',
      as: 'device'
    });
  };

  return PendingCommand;
};