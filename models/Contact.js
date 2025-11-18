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
          field: 'deviceId',
          references: {
              model: 'devices',
              key: 'deviceId',
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE'
          },
          comment: 'Reference to the device this contact belongs to'
      },
      contact_id: {
          type: DataTypes.STRING,
          allowNull: false,
          comment: 'Contact ID from Android device'
      },
      display_name: {
          type: DataTypes.STRING,
          allowNull: true
      },
      given_name: {
          type: DataTypes.STRING,
          allowNull: true
      },
      family_name: {
          type: DataTypes.STRING,
          allowNull: true
      },
      phone_numbers: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Array of phone number objects'
      },
      email_addresses: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Array of email address objects'
      },
      postal_addresses: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Array of postal address objects'
      },
      organization: {
          type: DataTypes.STRING,
          allowNull: true
      },
      job_title: {
          type: DataTypes.STRING,
          allowNull: true
      },
      photo_uri: {
          type: DataTypes.STRING,
          allowNull: true
      },
      starred: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
      },
      times_contacted: {
          type: DataTypes.INTEGER,
          defaultValue: 0
      },
      last_time_contacted: {
          type: DataTypes.DATE,
          allowNull: true
      },
      custom_ringtone: {
          type: DataTypes.STRING,
          allowNull: true
      },
      send_to_voicemail: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
      },
      notes: {
          type: DataTypes.TEXT,
          allowNull: true
      },
      sync_timestamp: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
      },
      is_deleted: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
      }
     }, {
      tableName: 'contacts',
      indexes: [
          {
              fields: ['deviceId'],
              name: 'idx_contacts_deviceId'
          },
          {
              fields: ['contact_id', 'deviceId'],
              unique: true,
              name: 'idx_contacts_contact_device'
          },
          {
              fields: ['display_name'],
              name: 'idx_contacts_display_name'
          },
          {
              fields: ['sync_timestamp'],
              name: 'idx_contacts_sync_timestamp'
          }
      ]
     });

  // Define associations
  Contact.associate = (models) => {
    if (models.Device) {
      Contact.belongsTo(models.Device, {
        foreignKey: 'deviceId',
        targetKey: 'deviceId',
        as: 'device'
      });
    }
  };

  // Add a class method to sync the model with the database
  Contact.syncWithDatabase = async (options = {}) => {
    try {
      // Skip foreign key checks to prevent issues with missing tables
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      
      // Sync the model with the database
      await Contact.sync(options);
      
      // Re-enable foreign key checks
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      
      return true;
    } catch (error) {
      console.error('Error syncing Contact model:', error);
      return false;
    }
  };

  return Contact;
};
