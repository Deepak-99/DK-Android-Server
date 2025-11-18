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
      field: 'deviceId',
      allowNull: false,
      references: { 
        model: 'devices', 
        key: 'deviceId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      }
    },
    appUpdateId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'appUpdateId',
      comment: 'Reference to app_updates table',
      references: { 
        model: 'app_updates', 
        key: 'id',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      }
    },
    installed_at: { type: DataTypes.DATE, allowNull: true },
    status: {
      type: DataTypes.ENUM('pending', 'installing', 'installed', 'failed'),
      defaultValue: 'installed'
    },
    error_message: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'app_installations',
    indexes: [
      {
        fields: ['deviceId'],
        name: 'idx_app_installations_device_id'
      },
      {
        fields: ['appUpdateId'],
        name: 'idx_app_installations_app_update_id'
      },
      
      {
        fields: [
          'deviceId', 
          'appUpdateId'
        ],
        unique: true,
        name: 'uniq_device_app_update',
        where: {
          app_update_id: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      }
    ]
  });

  // Define associations with optimized settings
  AppInstallation.associate = (models) => {
    // Define belongsTo relationships with syncOnAssociation: false
    if (models.AppUpdate) {
      AppInstallation.belongsTo(models.AppUpdate, {
        foreignKey: 'appUpdateId',
        as: 'appUpdate',
        constraints: true,
        syncOnAssociation: false,  // Prevent automatic table creation
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
    }
    
    if (models.Device) {
      AppInstallation.belongsTo(models.Device, {
        foreignKey: 'deviceId',
        targetKey: 'deviceId',
        as: 'device',
        constraints: true,
        syncOnAssociation: false,  // Prevent automatic table creation
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    }
  };
  
  // Add a class method to sync the model with the database
  AppInstallation.syncWithDatabase = async (options = {}) => {
    const transaction = await sequelize.transaction();
    
    try {
      // Skip foreign key checks to prevent issues with missing tables
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
      
      // Sync the model with the database
      await AppInstallation.sync({
        ...options,
        transaction,
        // Only add indexes if they don't exist
        alter: process.env.NODE_ENV !== 'production' ? {
          drop: false,  // Don't drop columns
          add: true,    // Add new columns
          remove: false // Don't remove columns
        } : false
      });
      
      // Create indexes manually to ensure they're not duplicated
      const queryInterface = sequelize.getQueryInterface();
      const indexes = await queryInterface.showIndex('app_installations');
      
      // Check if our unique index exists
      const hasUniqueIndex = indexes.some(
        index => index.name === 'uniq_device_app_update' && index.unique
      );
      
      if (!hasUniqueIndex) {
        await queryInterface.addIndex('app_installations', ['device_id', 'app_update_id'], {
          name: 'uniq_device_app_update',
          unique: true,
          transaction
        });
      }
      
      // Re-enable foreign key checks
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
      
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      console.error('Error syncing AppInstallation model:', error);
      return false;
    }
  };

  return AppInstallation;
};
