const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

  const CallLog = sequelize.define('CallLog', {

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

    callId: {
      type: DataTypes.STRING,
      field: 'call_id',
      allowNull: false
    },

    number: {
      type: DataTypes.STRING,
      allowNull: false
    },

    date: {
      type: DataTypes.DATE,
      allowNull: false
    },

    duration: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    type: {
      type: DataTypes.ENUM('incoming', 'outgoing', 'missed', 'voicemail', 'rejected', 'blocked'),
      allowNull: false
    },

    contactName: {
      type: DataTypes.STRING,
      field: 'contact_name'
    },

    numberType: {
      type: DataTypes.STRING,
      field: 'number_type'
    },

    numberLabel: {
      type: DataTypes.STRING,
      field: 'number_label'
    },

    countryIso: {
      type: DataTypes.STRING,
      field: 'country_iso'
    },

    dataUsage: {
      type: DataTypes.BIGINT,
      field: 'data_usage'
    },

    features: DataTypes.INTEGER,

    geocodedLocation: {
      type: DataTypes.STRING,
      field: 'geocoded_location'
    },

    isRead: {
      type: DataTypes.BOOLEAN,
      field: 'is_read',
      defaultValue: false
    },

    isNew: {
      type: DataTypes.BOOLEAN,
      field: 'is_new',
      defaultValue: true
    },

    phoneAccountId: {
      type: DataTypes.STRING,
      field: 'phone_account_id'
    },

    viaNumber: {
      type: DataTypes.STRING,
      field: 'via_number'
    },

    syncTimestamp: {
      type: DataTypes.DATE,
      field: 'sync_timestamp',
      defaultValue: DataTypes.NOW
    },

    isDeleted: {
      type: DataTypes.BOOLEAN,
      field: 'is_deleted',
      defaultValue: false
    }

  }, {
    tableName: 'call_logs',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['device_id'] },
      { fields: ['call_id'] },
      { fields: ['date'] }
    ]
  });

  CallLog.associate = (models) => {
    CallLog.belongsTo(models.Device, {
      foreignKey: 'deviceId',
      targetKey: 'deviceId',
      as: 'device'
    });
  };

  return CallLog;
};