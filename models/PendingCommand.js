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

  // Add sync options to handle foreign key constraints
  PendingCommand.syncWithDatabase = async function(options = {}) {
    const queryInterface = this.sequelize.getQueryInterface();
    const transaction = await this.sequelize.transaction();
    
    try {
      // Drop existing foreign key constraints if they exist
      await queryInterface.removeConstraint('pending_commands', 'pending_commands_ibfk_1', { transaction }).catch(() => {});
      await queryInterface.removeConstraint('pending_commands', 'pending_commands_deviceId_fk', { transaction }).catch(() => {});
      
      // Sync the model without applying indexes first
      await this.sync({ ...options, transaction, indexes: [] });
      
      // Add the correct foreign key constraint
      await queryInterface.addConstraint('pending_commands', {
        fields: ['deviceId'],
        type: 'foreign key',
        name: 'pending_commands_deviceId_fk',
        references: {
          table: 'devices',
          field: 'deviceId'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        transaction
      });
      
      // Get existing indexes
      const existingIndexes = await queryInterface.showIndex('pending_commands', { transaction });
      const indexNames = existingIndexes.map(idx => idx.Key_name);
      
      // Helper function to safely add an index if it doesn't exist
      const safeAddIndex = async (indexName, fields) => {
        if (!indexNames.includes(indexName)) {
          try {
            await queryInterface.addIndex('pending_commands', {
              name: indexName,
              fields: fields,
              transaction
            });
            console.log(`Created index ${indexName} on pending_commands`);
          } catch (error) {
            if (error.original && error.original.code === 'ER_DUP_KEYNAME') {
              console.log(`Index ${indexName} already exists, skipping creation`);
            } else {
              console.error(`Error creating index ${indexName}:`, error.message);
              throw error;
            }
          }
        } else {
          console.log(`Index ${indexName} already exists, skipping creation`);
        }
      };
      
      // Add status index
      await safeAddIndex('pending_commands_status', ['status']);
      
      // Add created_at index
      await safeAddIndex('pending_commands_created_at', ['created_at']);
      
      // Add expires_at index if the column exists
      const [columns] = await queryInterface.sequelize.query(
        "SHOW COLUMNS FROM `pending_commands` LIKE 'expires_at'",
        { transaction }
      );
      
      if (columns.length > 0) {
        await safeAddIndex('idx_pending_commands_expires_at', ['expires_at']);
      }
      
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      console.error('Error syncing PendingCommand model:', error);
      return false;
    }
  };

  return PendingCommand;
};
