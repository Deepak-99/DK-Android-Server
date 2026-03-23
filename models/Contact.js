const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

  const Contact = sequelize.define('Contact', {

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

    contactId: {
      type: DataTypes.STRING,
      field: 'contact_id',
      allowNull: false
    },

    displayName: {
      type: DataTypes.STRING,
      field: 'display_name'
    },

    givenName: {
      type: DataTypes.STRING,
      field: 'given_name'
    },

    familyName: {
      type: DataTypes.STRING,
      field: 'family_name'
    },

    phoneNumbers: {
      type: DataTypes.JSON,
      field: 'phone_numbers'
    },

    emailAddresses: {
      type: DataTypes.JSON,
      field: 'email_addresses'
    },

    postalAddresses: {
      type: DataTypes.JSON,
      field: 'postal_addresses'
    },

    organization: DataTypes.STRING,

    jobTitle: {
      type: DataTypes.STRING,
      field: 'job_title'
    },

    photoUri: {
      type: DataTypes.STRING,
      field: 'photo_uri'
    },

    starred: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    timesContacted: {
      type: DataTypes.INTEGER,
      field: 'times_contacted',
      defaultValue: 0
    },

    lastTimeContacted: {
      type: DataTypes.DATE,
      field: 'last_time_contacted'
    },

    customRingtone: {
      type: DataTypes.STRING,
      field: 'custom_ringtone'
    },

    sendToVoicemail: {
      type: DataTypes.BOOLEAN,
      field: 'send_to_voicemail',
      defaultValue: false
    },

    notes: DataTypes.TEXT,

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
    tableName: 'contacts',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      { fields: ['device_id'] },
      { fields: ['contact_id', 'device_id'], unique: true },
      { fields: ['display_name'] },
      { fields: ['sync_timestamp'] }
    ]
  });

  Contact.associate = (models) => {
    Contact.belongsTo(models.Device, {
      foreignKey: 'deviceId',
      targetKey: 'deviceId',
      as: 'device'
    });
  };

  return Contact;
};