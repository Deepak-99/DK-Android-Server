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
      call_id: {
          type: DataTypes.STRING,
          allowNull: false,
          comment: 'Call ID from Android device'
      },
      number: {
          type: DataTypes.STRING,
          field: 'number',
          allowNull: false,
          comment: 'Phone number'
      },
      date: {
          type: DataTypes.DATE,
          field: 'date',
          allowNull: false,
          comment: 'Date and time of call'
      },
      duration: {
          type: DataTypes.INTEGER,
          field: 'duration',
          allowNull: false,
          comment: 'Call duration in seconds'
      },
      type: {
          type: DataTypes.ENUM('incoming', 'outgoing', 'missed', 'voicemail', 'rejected', 'blocked'),
          field: 'type',
          allowNull: false
      },
      name: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Contact name if available'
      },
      number_type: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Type of number (mobile, home, work, etc.)'
      },
      number_label: {
          type: DataTypes.STRING,
          allowNull: true
      },
      country_iso: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Country ISO code'
      },
      data_usage: {
          type: DataTypes.BIGINT,
          allowNull: true,
          comment: 'Data usage in bytes'
      },
      features: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: 'Call features bitmask'
      },
      geocoded_location: {
          type: DataTypes.STRING,
          allowNull: true
      },
      is_read: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
      },
      new: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
      },
      phone_account_id: {
          type: DataTypes.STRING,
          allowNull: true
      },
      via_number: {
          type: DataTypes.STRING,
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
      tableName: 'call_logs',
      timestamps: false,
      indexes: [
          {
              fields: ['deviceId'],
              name: 'idx_call_logs_device_id'
          },
          {
              fields: ['call_id', 'deviceId'],
              unique: true,
              name: 'idx_call_logs_call_id_device_id'
          },
          {
              fields: ['number'],
              name: 'idx_call_logs_phone_number'
          },
          {
              fields: ['date'],
              name: 'idx_call_logs_date'
          },
          {
              fields: ['type'],
              name: 'idx_call_logs_type'
          },
          {
              fields: ['sync_timestamp'],
              name: 'idx_call_logs_sync_timestamp'
          }
      ],
      hooks: {
        afterSync: async (options) => {
          const queryInterface = options.sequelize.getQueryInterface();
          try {
            // Check if the constraint already exists
            const [results] = await queryInterface.sequelize.query(
              `SELECT CONSTRAINT_NAME 
               FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
               WHERE TABLE_NAME = 'call_logs' 
               AND CONSTRAINT_NAME = 'call_logs_device_id_fk'`
            );
            
            // Only add the constraint if it doesn't exist
            if (!results || results.length === 0) {
              // Drop existing foreign key constraints if they exist
              await queryInterface.removeConstraint('call_logs', 'call_logs_ibfk_1').catch(() => {});
              await queryInterface.removeConstraint('call_logs', 'call_logs_ibfk_2').catch(() => {});
              
              // Add the correct foreign key constraint
              await queryInterface.addConstraint('call_logs', {
                fields: ['deviceId'],
                type: 'foreign key',
                name: 'call_logs_device_id_fk',
                references: { 
                  table: 'devices', 
                  field: 'deviceId' 
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE'
              });
            }
          } catch (error) {
            console.error('Error setting up CallLog foreign keys:', error);
            throw error; // Re-throw to ensure sync fails if there's an error
          }
        }
      }
  });

// Add syncWithDatabase method for special handling
CallLog.syncWithDatabase = async (options = {}) => {
  const queryInterface = sequelize.getQueryInterface();
    try {
      // Drop existing foreign key constraints if they exist
      await queryInterface.removeConstraint('call_logs', 'call_logs_ibfk_1').catch(() => {});
      await queryInterface.removeConstraint('call_logs', 'call_logs_ibfk_2').catch(() => {});
      await queryInterface.removeConstraint('call_logs', 'call_logs_device_id_fk').catch(() => {});
      
      // Sync the model
      await CallLog.sync(options);
      
      // First, remove the unique index if it exists
      await queryInterface.removeIndex('call_logs', 'idx_call_logs_call_id_device_id').catch(() => {});
      
      // Add the correct foreign key constraint (catch error if it already exists)
      try {
        await queryInterface.addConstraint('call_logs', {
          fields: ['deviceId'],
          type: 'foreign key',
          name: 'call_logs_device_id_fk',
          references: { 
            table: 'devices', 
            field: 'deviceId' 
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        });
      } catch (constraintError) {
        // Ignore if constraint already exists
        if (!constraintError.message.includes('Duplicate')) {
          throw constraintError;
        }
      }
      
      // Recreate the index without the unique constraint
      await queryInterface.addIndex('call_logs', {
        fields: ['call_id', 'device_id'],
        name: 'idx_call_logs_call_id_device_id',
        unique: false // Changed from unique: true to allow duplicates
      });
      
      return true;
    } catch (error) {
      console.error('Error syncing CallLog model:', error);
      return false;
    }
  };

  return CallLog;
};
