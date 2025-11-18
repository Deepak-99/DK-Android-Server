const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SMS = sequelize.define('SMS', {
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
      smsId: {
          type: DataTypes.STRING,
          field: 'smsId',
          allowNull: false,
          unique: true,
          comment: 'SMS ID from Android device'
      },
      threadId: {
          type: DataTypes.STRING,
          field: 'threadId',
          allowNull: true,
          comment: 'Conversation thread ID',
          index: true
      },
      address: {
          type: DataTypes.STRING,
          allowNull: false,
          comment: 'Phone number or contact address'
      },
      person: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Contact person ID'
      },
      date: {
          type: DataTypes.DATE,
          allowNull: false,
          comment: 'Date SMS was sent/received',
          index: true
      },
      dateSent: {
          type: DataTypes.DATE,
          field: 'dateSent',
          allowNull: true,
          comment: 'Date SMS was sent (for sent messages)'
      },
      protocol: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: 'Protocol identifier'
      },
      read: {
          type: DataTypes.BOOLEAN,
          field: 'isRead',
          defaultValue: false,
          comment: 'Whether the message has been read'
      },
      status: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: 'Status of the message'
      },
      type: {
          type: DataTypes.ENUM('inbox', 'sent', 'draft', 'outbox', 'failed', 'queued'),
          field: 'type',
          allowNull: false,
          comment: 'Type of message',
          index: true
      },
      replyPathPresent: {
          type: DataTypes.BOOLEAN,
          field: 'replyPathPresent',
          defaultValue: false,
          comment: 'Whether reply path exists'
      },
      subject: {
          type: DataTypes.STRING,
          field: 'subject',
          allowNull: true,
          comment: 'Subject of the message (for MMS)'
      },
      body: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Message content'
      },
      serviceCenter: {
          type: DataTypes.STRING,
          field: 'serviceCenter',
          allowNull: true,
          comment: 'Service center address'
      },
      isSeen: {
          type: DataTypes.BOOLEAN,
          field: 'isSeen',
          defaultValue: true,
          comment: 'Whether the message has been seen in the notification'
      },
      isDeleted: {
          type: DataTypes.BOOLEAN,
          field: 'isDeleted',
          defaultValue: false,
          comment: 'Soft delete flag'
      },
      errorCode: {
          type: DataTypes.INTEGER,
          field: 'errorCode',
          allowNull: true,
          comment: 'Error code if message failed to send'
      },
      subscriptionId: {
          type: DataTypes.INTEGER,
          field: 'subscriptionId',
          allowNull: true,
          comment: 'SIM card subscription ID for multi-SIM devices'
      },
      creator: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Package name of the app that created the message'
      },
      isFavorite: {
          type: DataTypes.BOOLEAN,
          field: 'isFavorite',
          defaultValue: false,
          comment: 'Whether the message is marked as favorite'
      },
      isForwarded: {
          type: DataTypes.BOOLEAN,
          field: 'isForwarded',
          defaultValue: false,
          comment: 'Whether the message has been forwarded'
      },
      isReply: {
          type: DataTypes.BOOLEAN,
          field: 'isReply',
          defaultValue: false,
          comment: 'Whether this is a reply to another message'
      },
      isScheduled: {
          type: DataTypes.BOOLEAN,
          field: 'isScheduled',
          defaultValue: false,
          comment: 'Whether this is a scheduled message'
      },
      scheduledTime: {
          type: DataTypes.DATE,
          field: 'scheduledTime',
          allowNull: true,
          comment: 'When the message is scheduled to be sent'
      },
      isDelivered: {
          type: DataTypes.BOOLEAN,
          field: 'isDelivered',
          defaultValue: false,
          comment: 'Whether the message has been delivered'
      },
      isFailed: {
          type: DataTypes.BOOLEAN,
          field: 'isFailed',
          defaultValue: false,
          comment: 'Whether the message failed to send'
      },
      isPending: {
          type: DataTypes.BOOLEAN,
          field: 'isPending',
          defaultValue: false,
          comment: 'Whether the message is pending to be sent'
      },
      isDownloaded: {
          type: DataTypes.BOOLEAN,
          field: 'isDownloaded',
          defaultValue: true,
          comment: 'Whether the message has been downloaded from the server'
      },
      isLocked: {
          type: DataTypes.BOOLEAN,
          field: 'isLocked',
          defaultValue: false,
          comment: 'Whether the message is locked from deletion'
      },
      isReported: {
          type: DataTypes.BOOLEAN,
          field: 'isReported',
          defaultValue: false,
          comment: 'Whether the message has been reported as spam'
      },
      isPhishing: {
          type: DataTypes.BOOLEAN,
          field: 'isPhishing',
          defaultValue: false,
          comment: 'Whether the message has been detected as phishing'
      },
      isSpam: {
          type: DataTypes.BOOLEAN,
          field: 'isSpam',
          defaultValue: false,
          comment: 'Whether the message has been marked as spam'
      },
      isBlocked: {
          type: DataTypes.BOOLEAN,
          field: 'isBlocked',
          defaultValue: false,
          comment: 'Whether the sender is blocked'
      },
      isArchived: {
          type: DataTypes.BOOLEAN,
          field: 'isArchived',
          defaultValue: false,
          comment: 'Whether the message is archived'
      },
      isStarred: {
          type: DataTypes.BOOLEAN,
          field: 'isStarred',
          defaultValue: false,
          comment: 'Whether the message is starred'
      },
      isTrashed: {
          type: DataTypes.BOOLEAN,
          field: 'isTrashed',
          defaultValue: false,
          comment: 'Whether the message is in trash'
      },
      isUnread: {
          type: DataTypes.BOOLEAN,
          field: 'isUnread',
          defaultValue: true,
          comment: 'Whether the message is unread'
      },
      isVoiceMail: {
          type: DataTypes.BOOLEAN,
          field: 'isVoiceMail',
          defaultValue: false,
          comment: 'Whether this is a voicemail message'
      },
      isMMS: {
          type: DataTypes.BOOLEAN,
          field: 'isMMS',
          defaultValue: false,
          comment: 'Whether this is an MMS message'
      },
      isGroup: {
          type: DataTypes.BOOLEAN,
          field: 'isGroup',
          defaultValue: false,
          comment: 'Whether this is a group message'
      },
      isBroadcast: {
          type: DataTypes.BOOLEAN,
          field: 'isBroadcast',
          defaultValue: false,
          comment: 'Whether this is a broadcast message'
      },
      isEncrypted: {
          type: DataTypes.BOOLEAN,
          field: 'isEncrypted',
          defaultValue: false,
          comment: 'Whether the message is encrypted'
      },
      isSecure: {
          type: DataTypes.BOOLEAN,
          field: 'isSecure',
          defaultValue: false,
          comment: 'Whether the message is secure'
      },
      isSensitive: {
          type: DataTypes.BOOLEAN,
          field: 'isSensitive',
          defaultValue: false,
          comment: 'Whether the message contains sensitive content'
      },
      isSynced: {
          type: DataTypes.BOOLEAN,
          field: 'isSynced',
          defaultValue: false,
          comment: 'Whether the message has been synced with the server'
      },
      isUploaded: {
          type: DataTypes.BOOLEAN,
          field: 'isUploaded',
          defaultValue: false,
          comment: 'Whether the message has been uploaded to the server'
      },
      isVerified: {
          type: DataTypes.BOOLEAN,
          field: 'isVerified',
          defaultValue: false,
          comment: 'Whether the sender has been verified'
      },
      isWhitelisted: {
          type: DataTypes.BOOLEAN,
          field: 'isWhitelisted',
          defaultValue: false,
          comment: 'Whether the sender is whitelisted'
      },
      isBlacklisted: {
          type: DataTypes.BOOLEAN,
          field: 'isBlacklisted',
          defaultValue: false,
          comment: 'Whether the sender is blacklisted'
      },
      isBlockedContact: {
          type: DataTypes.BOOLEAN,
          field: 'isBlockedContact',
          defaultValue: false,
          comment: 'Whether the sender is in the blocked contacts list'
      },
      isEmergencyContact: {
          type: DataTypes.BOOLEAN,
          field: 'isEmergencyContact',
          defaultValue: false,
          comment: 'Whether the sender is an emergency contact'
      },
      isFavoriteContact: {
          type: DataTypes.BOOLEAN,
          field: 'isFavoriteContact',
          defaultValue: false,
          comment: 'Whether the sender is a favorite contact'
      },
      isPriority: {
          type: DataTypes.BOOLEAN,
          field: 'isPriority',
          defaultValue: false,
          comment: 'Whether the message is marked as priority'
      },
      isSilent: {
          type: DataTypes.BOOLEAN,
          field: 'isSilent',
          defaultValue: false,
          comment: 'Whether the message should be delivered silently'
      },
      isSnoozed: {
          type: DataTypes.BOOLEAN,
          field: 'isSnoozed',
          defaultValue: false,
          comment: 'Whether the message notification is snoozed'
      },
      isVibrate: {
          type: DataTypes.BOOLEAN,
          field: 'isVibrate',
          defaultValue: true,
          comment: 'Whether the message should vibrate when received'
      },
      isMuted: {
          type: DataTypes.BOOLEAN,
          field: 'isMuted',
          defaultValue: false,
          comment: 'Whether notifications for this thread are muted'
      },
      isPinned: {
          type: DataTypes.BOOLEAN,
          field: 'isPinned',
          defaultValue: false,
          comment: 'Whether the message is pinned in the conversation'
      },
      isReadReceiptRequested: {
          type: DataTypes.BOOLEAN,
          field: 'isReadReceiptRequested',
          defaultValue: false,
          comment: 'Whether a read receipt was requested for this message'
      },
      isReadReceiptSent: {
          type: DataTypes.BOOLEAN,
          field: 'isReadReceiptSent',
          defaultValue: false,
          comment: 'Whether a read receipt was sent for this message'
      },
      isDeliveryReceiptRequested: {
          type: DataTypes.BOOLEAN,
          field: 'isDeliveryReceiptRequested',
          defaultValue: false,
          comment: 'Whether a delivery receipt was requested for this message'
      },
      isDeliveryReceiptReceived: {
          type: DataTypes.BOOLEAN,
          field: 'isDeliveryReceiptReceived',
          defaultValue: false,
          comment: 'Whether a delivery receipt was received for this message'
      },
      messageClass: {
          type: DataTypes.ENUM('class1', 'class2', 'class3', 'class4'),
          field: 'messageClass',
          allowNull: true,
          comment: 'Message class for MMS messages'
      },
      messageType: {
          type: DataTypes.ENUM('text', 'image', 'video', 'audio', 'vcard', 'location', 'contact', 'document', 'unknown'),
          field: 'messageType',
          allowNull: false,
          defaultValue: 'text',
          comment: 'Type of message content'
      },
      mimeType: {
          type: DataTypes.STRING,
          field: 'mimeType',
          allowNull: true,
          comment: 'MIME type of the message content'
      },
      priority: {
          type: DataTypes.ENUM('high', 'normal', 'low'),
          field: 'priority',
          defaultValue: 'normal',
          comment: 'Message priority level'
      },
      readStatus: {
          type: DataTypes.ENUM('read', 'unread', 'partially_read'),
          field: 'readStatus',
          defaultValue: 'unread',
          comment: 'Detailed read status of the message'
      },
      seen: {
          type: DataTypes.BOOLEAN,
          field: 'seen',
          defaultValue: false,
          comment: 'Whether the message has been seen by the user'
      },
      seenBy: {
          type: DataTypes.JSON,
          field: 'seenBy',
          allowNull: true,
          comment: 'Array of user IDs who have seen the message (for group chats)'
      },
      sentTimestamp: {
          type: DataTypes.DATE,
          field: 'sentTimestamp',
          allowNull: true,
          comment: 'Exact timestamp when the message was sent'
      },
      messageStatus: {
          type: DataTypes.ENUM('pending', 'sent', 'delivered', 'failed', 'queued'),
          field: 'messageStatus',
          defaultValue: 'pending',
          comment: 'Current status of the message'
      },
      text: {
          type: DataTypes.TEXT,
          field: 'text',
          allowNull: true,
          comment: 'Text content of the message'
      },
      timestamp: {
          type: DataTypes.DATE,
          field: 'timestamp',
          allowNull: false,
          comment: 'When the message was created',
          index: true
      },
      to: {
          type: DataTypes.STRING,
          field: 'to',
          allowNull: true,
          comment: 'Recipient phone number (for sent messages)'
      },
      uri: {
          type: DataTypes.STRING,
          field: 'uri',
          allowNull: true,
          comment: 'URI to the message content (for MMS)'
      },
      locked: {
          type: DataTypes.BOOLEAN,
          field: 'locked',
          defaultValue: false,
          comment: 'Whether the message is locked'
      },
      subId: {
          type: DataTypes.INTEGER,
          field: 'subId',
          allowNull: true,
          comment: 'Subscription ID for multi-SIM devices'
      },
      simSlot: {
          type: DataTypes.INTEGER,
          field: 'simSlot',
          allowNull: true,
          comment: 'SIM slot used for the message'
      },
      simId: {
          type: DataTypes.STRING,
          field: 'simId',
          allowNull: true,
          comment: 'Unique identifier of the SIM card'
      },
      simSerialNumber: {
          type: DataTypes.STRING,
          field: 'simSerialNumber',
          allowNull: true,
          comment: 'Serial number of the SIM card'
      },
      simOperator: {
          type: DataTypes.STRING,
          field: 'simOperator',
          allowNull: true,
          comment: 'Mobile network operator code'
      },
      simOperatorName: {
          type: DataTypes.STRING,
          field: 'simOperatorName',
          allowNull: true,
          comment: 'Mobile network operator name'
      },
      simCountryIso: {
          type: DataTypes.STRING(2),
          field: 'simCountryIso',
          allowNull: true,
          comment: 'ISO country code of the SIM provider'
      },
      updatedAt: {
          type: DataTypes.DATE,
          field: 'updatedAt',
          allowNull: false,
          comment: 'When the message was last updated'
      },
      comment: 'Error code if message failed'
      ,
      isMms: {
          type: DataTypes.BOOLEAN,
          field: 'is_mms',
          defaultValue: false,
          comment: 'Whether this is an MMS message'
      },
      messageBox: {
          type: DataTypes.ENUM('inbox', 'sent', 'drafts', 'outbox', 'failed', 'queued'),
          field: 'message_box',
          allowNull: true,
          comment: 'Folder this message belongs to'
      },
      syncTimestamp: {
          type: DataTypes.DATE,
          field: 'syncTimestamp',
          defaultValue: DataTypes.NOW,
          comment: 'Timestamp when the record was last synced'
      },
   }, {
    tableName: 'sms',
    underscored: false,
    timestamps: true,
    indexes: [
      {
        name: 'sms_deviceId',
        fields: ['deviceId']
      },
      {
        name: 'sms_sms_id_deviceId',
        fields: ['smsId', 'deviceId'],
        unique: true
      },
      {
        name: 'sms_address',
        fields: ['address']
      },
      {
        name: 'sms_date',
        fields: ['date']
      },
      {
        name: 'sms_thread_id',
        fields: ['threadId']
      },
      {
        name: 'idx_sms_thread_id',
        fields: ['threadId']
      },
      {
        name: 'idx_sms_sync_timestamp',
        fields: ['syncTimestamp']
      }
    ]
  }
);

  // Add syncWithDatabase method for special handling
  SMS.syncWithDatabase = async (options = {}) => {
    const queryInterface = sequelize.getQueryInterface();
    const transaction = await sequelize.transaction();
    
    try {
      // Drop existing foreign key constraints if they exist
      await queryInterface.removeConstraint('sms_messages', 'sms_messages_ibfk_1', { transaction }).catch(() => {});
      await queryInterface.removeConstraint('sms_messages', 'sms_messages_deviceId_fk', { transaction }).catch(() => {});
      
      // Sync the model without applying indexes first
      await SMS.sync({ ...options, transaction, indexes: [] });
      
      // Add the correct foreign key constraint
      await queryInterface.addConstraint('sms_messages', {
        fields: ['deviceId'],
        type: 'foreign key',
        name: 'sms_messages_deviceId_fk',
        references: { 
          table: 'devices', 
          field: 'deviceId' 
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        transaction
      });
      
      // Get existing indexes
      let existingIndexes = [];
      try {
        existingIndexes = await queryInterface.showIndex('sms_messages', { transaction });
      } catch (error) {
        console.warn('Could not retrieve existing indexes, will attempt to create them:', error.message);
      }
      
      const indexNames = existingIndexes.map(idx => idx.Key_name);
      
      // Helper function to safely add an index
      const safeAddIndex = async (indexName, fields, options = {}) => {
        if (!indexNames.includes(indexName)) {
          try {
            await queryInterface.addIndex('sms_messages', fields, {
              name: indexName,
              transaction,
              ...options
            });
            console.log(`Created index ${indexName} on sms_messages`);
            return true;
          } catch (error) {
            if (error.original && error.original.code === 'ER_DUP_KEYNAME') {
              console.log(`Index ${indexName} already exists, skipping creation`);
              return true;
            } else {
              console.error(`Error creating index ${indexName}:`, error.message);
              throw error;
            }
          }
        } else {
          console.log(`Index ${indexName} already exists, skipping creation`);
          return true;
        }
      };
      
      // Add necessary indexes
      try {
        await safeAddIndex('sms_messages_deviceId', ['deviceId']);
        await safeAddIndex('sms_messages_thread_id', ['thread_id']);
        await safeAddIndex('sms_messages_address', ['address']);
        await safeAddIndex('sms_messages_date', ['date']);
        await safeAddIndex('sms_messages_type', ['type']);
      } catch (error) {
        console.error('Failed to create one or more indexes:', error);
        throw error;
      }
      
      await transaction.commit();
      return SMS;
    } catch (error) {
      await transaction.rollback();
      console.error('Error syncing SMS model:', error);
      throw error;
    }
  };

  return SMS;
};
