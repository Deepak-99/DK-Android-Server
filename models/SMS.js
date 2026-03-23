const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

  return sequelize.define('SMS', {

      id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
      },

      deviceId: {
          type: DataTypes.STRING,
          field: 'device_id',
          allowNull: false
      },

      smsId: {
          type: DataTypes.STRING,
          field: 'sms_id',
          allowNull: false
      },

      threadId: {
          type: DataTypes.STRING,
          field: 'thread_id'
      },

      address: {
          type: DataTypes.STRING,
          allowNull: false
      },

      contactName: {
          type: DataTypes.STRING,
          field: 'contact_name'
      },

      body: DataTypes.TEXT,

      type: {
          type: DataTypes.ENUM('inbox', 'sent', 'draft', 'outbox', 'failed'),
          allowNull: false
      },

      status: DataTypes.INTEGER,

      date: {
          type: DataTypes.DATE,
          allowNull: false
      },

      dateSent: {
          type: DataTypes.DATE,
          field: 'date_sent'
      },

      isRead: {
          type: DataTypes.BOOLEAN,
          field: 'is_read',
          defaultValue: false
      },

      isDeleted: {
          type: DataTypes.BOOLEAN,
          field: 'is_deleted',
          defaultValue: false
      },

      simSlot: {
          type: DataTypes.INTEGER,
          field: 'sim_slot'
      },

      subscriptionId: {
          type: DataTypes.INTEGER,
          field: 'subscription_id'
      },

      syncTimestamp: {
          type: DataTypes.DATE,
          field: 'sync_timestamp',
          defaultValue: DataTypes.NOW
      }

  }, {
      tableName: 'sms',
      timestamps: true,
      underscored: true,
      indexes: [
          {fields: ['device_id']},
          {fields: ['device_id', 'date']},
          {fields: ['device_id', 'thread_id']},
          {fields: ['address']},
          {fields: ['type']},
          {fields: ['sms_id', 'device_id'], unique: true}
      ]
  });
};