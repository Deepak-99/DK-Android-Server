const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AppInstallation = sequelize.define('AppInstallation', {

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

    appUpdateId: {
      type: DataTypes.UUID,
      field: 'app_update_id',
      allowNull: true,
      references: {
        model: 'app_updates',
        key: 'id'
      }
    },

    installedAt: {
      type: DataTypes.DATE,
      field: 'installed_at'
    },

    status: {
      type: DataTypes.ENUM('pending', 'installing', 'installed', 'failed'),
      defaultValue: 'installed'
    },

    errorMessage: {
      type: DataTypes.TEXT,
      field: 'error_message'
    }

  }, {
    tableName: 'app_installations',
    underscored: true,
    indexes: [
      { fields: ['device_id'] },
      { fields: ['app_update_id'] }
    ]
  });

  AppInstallation.associate = (models) => {
    AppInstallation.belongsTo(models.Device, {
      foreignKey: 'deviceId',
      as: 'device'
    });

    AppInstallation.belongsTo(models.AppUpdate, {
      foreignKey: 'appUpdateId',
      as: 'appUpdate'
    });
  };

  return AppInstallation;
};