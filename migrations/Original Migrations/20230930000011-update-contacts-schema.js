'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const contactsTableName = 'contacts';
    const deviceContactsTableName = 'device_contacts';
    const deviceContactDetailsTableName = 'device_contact_details';
    
    try {
      // Check if the new contacts table already exists
      const [tables] = await queryInterface.sequelize.query(
        `SHOW TABLES LIKE '${contactsTableName}'`,
        { transaction }
      );
      
      const newTableExists = tables.length > 0;
      
      // Check if the old device_contacts table exists
      const [oldTables] = await queryInterface.sequelize.query(
        `SHOW TABLES LIKE '${deviceContactsTableName}'`,
        { transaction }
      );
      
      const oldTableExists = oldTables.length > 0;
      
      if (!newTableExists) {
        // Create the new contacts table
        await queryInterface.createTable(contactsTableName, {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          device_id: {
            type: Sequelize.STRING(255),
            allowNull: false,
            references: {
              model: 'devices',
              key: 'device_id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: 'Reference to devices table (deviceId)'
          },
          contact_id: {
            type: Sequelize.STRING(255),
            allowNull: false,
            comment: 'Contact ID from Android device'
          },
          display_name: {
            type: Sequelize.STRING(255),
            allowNull: true
          },
          given_name: {
            type: Sequelize.STRING(100),
            allowNull: true
          },
          family_name: {
            type: Sequelize.STRING(100),
            allowNull: true
          },
          phone_numbers: {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'Array of phone number objects'
          },
          email_addresses: {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'Array of email address objects'
          },
          postal_addresses: {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'Array of postal address objects'
          },
          organization: {
            type: Sequelize.STRING(255),
            allowNull: true
          },
          job_title: {
            type: Sequelize.STRING(255),
            allowNull: true
          },
          photo_uri: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          starred: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          times_contacted: {
            type: Sequelize.INTEGER,
            defaultValue: 0
          },
          last_time_contacted: {
            type: Sequelize.DATE,
            allowNull: true
          },
          custom_ringtone: {
            type: Sequelize.STRING(255),
            allowNull: true
          },
          send_to_voicemail: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          notes: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          sync_timestamp: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          is_deleted: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
          }
        }, { transaction });
        
        // Add indexes
        await queryInterface.addIndex(contactsTableName, ['device_id'], {
          name: 'idx_contacts_device_id',
          transaction
        });
        
        await queryInterface.addIndex(contactsTableName, ['contact_id'], {
          name: 'idx_contacts_contact_id',
          transaction
        });
        
        await queryInterface.addIndex(contactsTableName, ['display_name'], {
          name: 'idx_contacts_display_name',
          transaction
        });
        
        // If the old table exists, migrate data from it
        if (oldTableExists) {
          // Get all contacts from the old table
          const [contacts] = await queryInterface.sequelize.query(
            `SELECT * FROM ${deviceContactsTableName}`,
            { transaction, type: queryInterface.sequelize.QueryTypes.SELECT }
          );
          
          if (contacts && contacts.length > 0) {
            // Get all contact details
            const [contactDetails] = await queryInterface.sequelize.query(
              `SELECT * FROM ${deviceContactDetailsTableName}`,
              { transaction, type: queryInterface.sequelize.QueryTypes.SELECT }
            );
            
            // Group details by contact_id
            const detailsByContactId = {};
            if (contactDetails && contactDetails.length > 0) {
              contactDetails.forEach(detail => {
                if (!detailsByContactId[detail.contact_id]) {
                  detailsByContactId[detail.contact_id] = [];
                }
                detailsByContactId[detail.contact_id].push(detail);
              });
            }
            
            // Process each contact
            for (const contact of contacts) {
              const phoneNumbers = [];
              const emailAddresses = [];
              const postalAddresses = [];
              
              // Process contact details if they exist
              if (detailsByContactId[contact.contact_id]) {
                detailsByContactId[contact.contact_id].forEach(detail => {
                  const detailObj = {
                    type: detail.type,
                    label: detail.label || detail.type_label,
                    data: detail.data,
                    is_primary: detail.is_primary
                  };
                  
                  // Categorize by MIME type
                  if (detail.mimetype === 'vnd.android.cursor.item/phone_v2') {
                    phoneNumbers.push(detailObj);
                  } else if (detail.mimetype === 'vnd.android.cursor.item/email_v2') {
                    emailAddresses.push(detailObj);
                  } else if (detail.mimetype === 'vnd.android.cursor.item/postal-address_v2') {
                    postalAddresses.push(detailObj);
                  }
                });
              }
              
              // Insert into the new contacts table
              await queryInterface.bulkInsert(
                contactsTableName,
                [{
                  id: Sequelize.UUIDV4(),
                  device_id: contact.device_id,
                  contact_id: contact.contact_id,
                  display_name: contact.display_name,
                  given_name: contact.first_name,
                  family_name: contact.last_name,
                  phone_numbers: phoneNumbers.length > 0 ? phoneNumbers : null,
                  email_addresses: emailAddresses.length > 0 ? emailAddresses : null,
                  postal_addresses: postalAddresses.length > 0 ? postalAddresses : null,
                  organization: contact.organization,
                  job_title: contact.job_title,
                  photo_uri: contact.photo_uri,
                  starred: contact.starred || false,
                  times_contacted: contact.times_contacted || 0,
                  last_time_contacted: contact.last_time_contacted,
                  custom_ringtone: null, // Not in old schema
                  send_to_voicemail: false, // Default value
                  notes: contact.note,
                  sync_timestamp: new Date(),
                  is_deleted: contact.deleted || false,
                  created_at: contact.created_at || new Date(),
                  updated_at: contact.updated_at || new Date()
                }],
                { transaction }
              );
            }
          }
          
          // Drop the old tables after migration
          await queryInterface.dropTable(deviceContactDetailsTableName, { transaction });
          await queryInterface.dropTable(deviceContactsTableName, { transaction });
        }
      } else if (oldTableExists) {
        // New table exists but old tables also exist - drop the old ones
        await queryInterface.dropTable(deviceContactDetailsTableName, { transaction });
        await queryInterface.dropTable(deviceContactsTableName, { transaction });
      }
      
      // Check and modify table structure using raw SQL
      const [columns] = await queryInterface.sequelize.query(
        `SHOW COLUMNS FROM ${contactsTableName}`,
        { transaction }
      );
      
      const columnNames = columns.map(col => col.Field);
      
      // Check if we need to rename first_name to given_name
      if (columnNames.includes('first_name') && !columnNames.includes('given_name')) {
        await queryInterface.sequelize.query(
          `ALTER TABLE ${contactsTableName} CHANGE first_name given_name VARCHAR(100)`,
          { transaction }
        );
      }
      
      // Check if we need to rename last_name to family_name
      if (columnNames.includes('last_name') && !columnNames.includes('family_name')) {
        await queryInterface.sequelize.query(
          `ALTER TABLE ${contactsTableName} CHANGE last_name family_name VARCHAR(100)`,
          { transaction }
        );
      }
      
      // Check and add any missing columns
      if (!columnNames.includes('phone_numbers')) {
        await queryInterface.addColumn(
          contactsTableName,
          'phone_numbers',
          {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'Array of phone number objects'
          },
          { transaction }
        );
      }
      
      if (!columnNames.includes('email_addresses')) {
        await queryInterface.addColumn(
          contactsTableName,
          'email_addresses',
          {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'Array of email address objects'
          },
          { transaction }
        );
      }
      
      if (!columnNames.includes('postal_addresses')) {
        await queryInterface.addColumn(
          contactsTableName,
          'postal_addresses',
          {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'Array of postal address objects'
          },
          { transaction }
        );
      }
      
      if (!columnNames.includes('custom_ringtone')) {
        await queryInterface.addColumn(
          contactsTableName,
          'custom_ringtone',
          {
            type: Sequelize.STRING(255),
            allowNull: true
          },
          { transaction }
        );
      }
      
      if (!columnNames.includes('send_to_voicemail')) {
        await queryInterface.addColumn(
          contactsTableName,
          'send_to_voicemail',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
          },
          { transaction }
        );
      }
      
      if (!columnNames.includes('sync_timestamp')) {
        await queryInterface.addColumn(
          contactsTableName,
          'sync_timestamp',
          {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          { transaction }
        );
      }
      
      if (!columnNames.includes('is_deleted')) {
        await queryInterface.addColumn(
          contactsTableName,
          'is_deleted',
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
          },
          { transaction }
        );
      }
      
      // Check and add any missing indexes using raw SQL
      const [indexes] = await queryInterface.sequelize.query(
        `SHOW INDEX FROM ${contactsTableName}`,
        { transaction }
      );
      
      const indexNames = [...new Set(indexes.map(idx => idx.Key_name))];
      
      // Add index for contact_id if it doesn't exist
      if (!indexNames.includes('idx_contacts_contact_id')) {
        await queryInterface.sequelize.query(
          `CREATE INDEX idx_contacts_contact_id ON ${contactsTableName}(contact_id)`,
          { transaction }
        );
      }
      
      // Add index for display_name if it doesn't exist
      if (!indexNames.includes('idx_contacts_display_name')) {
        await queryInterface.sequelize.query(
          `CREATE INDEX idx_contacts_display_name ON ${contactsTableName}(display_name)`,
          { transaction }
        );
      }
      
      // Add index for is_deleted if it doesn't exist
      if (!indexNames.includes('idx_contacts_is_deleted')) {
        await queryInterface.sequelize.query(
          `CREATE INDEX idx_contacts_is_deleted ON ${contactsTableName}(is_deleted)`,
          { transaction }
        );
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error in contacts migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Note: This is a complex migration and cannot be fully rolled back automatically
    // due to the data transformation from multiple tables to a single table
    // A full database restore would be needed to properly revert this
    
    const transaction = await queryInterface.sequelize.transaction();
    const contactsTableName = 'contacts';
    const deviceContactsTableName = 'device_contacts';
    const deviceContactDetailsTableName = 'device_contact_details';
    
    try {
      // Check if the old tables exist
      const [oldTables] = await queryInterface.sequelize.query(
        `SHOW TABLES LIKE '${deviceContactsTableName}'`,
        { transaction }
      );
      
      // If the old tables don't exist, we can't perform a proper rollback
      if (oldTables.length === 0) {
        console.warn('Cannot fully rollback contacts migration: old tables do not exist');
        await transaction.commit();
        return;
      }
      
      // Remove any newly added columns from the contacts table
      const columns = await queryInterface.describeTable(contactsTableName, { transaction });
      
      if (columns.phone_numbers) {
        await queryInterface.removeColumn(contactsTableName, 'phone_numbers', { transaction });
      }
      
      if (columns.email_addresses) {
        await queryInterface.removeColumn(contactsTableName, 'email_addresses', { transaction });
      }
      
      if (columns.postal_addresses) {
        await queryInterface.removeColumn(contactsTableName, 'postal_addresses', { transaction });
      }
      
      if (columns.custom_ringtone) {
        await queryInterface.removeColumn(contactsTableName, 'custom_ringtone', { transaction });
      }
      
      if (columns.send_to_voicemail) {
        await queryInterface.removeColumn(contactsTableName, 'send_to_voicemail', { transaction });
      }
      
      if (columns.sync_timestamp) {
        await queryInterface.removeColumn(contactsTableName, 'sync_timestamp', { transaction });
      }
      
      if (columns.is_deleted) {
        await queryInterface.removeColumn(contactsTableName, 'is_deleted', { transaction });
      }
      
      // Rename columns back if they were renamed
      if (columns.given_name && !columns.first_name) {
        await queryInterface.renameColumn(
          contactsTableName,
          'given_name',
          'first_name',
          { transaction }
        );
      }
      
      if (columns.family_name && !columns.last_name) {
        await queryInterface.renameColumn(
          contactsTableName,
          'family_name',
          'last_name',
          { transaction }
        );
      }
      
      // Remove any added indexes
      const indexes = await queryInterface.showIndex(contactsTableName, { transaction });
      
      if (indexes.some(idx => idx.name === 'idx_contacts_contact_id')) {
        await queryInterface.removeIndex(contactsTableName, 'idx_contacts_contact_id', { transaction });
      }
      
      if (indexes.some(idx => idx.name === 'idx_contacts_display_name')) {
        await queryInterface.removeIndex(contactsTableName, 'idx_contacts_display_name', { transaction });
      }
      
      if (indexes.some(idx => idx.name === 'idx_contacts_is_deleted')) {
        await queryInterface.removeIndex(contactsTableName, 'idx_contacts_is_deleted', { transaction });
      }
      
      // Note: We cannot automatically restore the data that was in the old tables
      // as it may have been modified or deleted after the migration
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error rolling back contacts migration:', error);
      throw error;
    }
  }
};
