const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('MediaFile', {
      id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
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
          comment: 'Reference to devices table (deviceId)'
      },
      filename: {
          type: DataTypes.STRING,
          allowNull: false
      },
      original_name: {
          type: DataTypes.STRING,
          allowNull: false
      },
      file_path: {
          type: DataTypes.STRING,
          allowNull: false
      },
      file_size: {
          type: DataTypes.BIGINT,
          allowNull: false,
          comment: 'File size in bytes'
      },
      mime_type: {
          type: DataTypes.STRING,
          allowNull: false
      },
      media_type: {
          type: DataTypes.ENUM('image', 'video', 'audio', 'document', 'other'),
          allowNull: false
      },
      duration: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: 'Duration in seconds for video/audio files'
      },
      width: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: 'Width in pixels for images/videos'
      },
      height: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: 'Height in pixels for images/videos'
      },
      thumbnail_path: {
          type: DataTypes.STRING,
          allowNull: true
      },
      captured_at: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'When the media was originally captured'
      },
      location_latitude: {
          type: DataTypes.DECIMAL(10, 8),
          allowNull: true
      },
      location_longitude: {
          type: DataTypes.DECIMAL(11, 8),
          allowNull: true
      },
      upload_status: {
          type: DataTypes.ENUM('pending', 'uploading', 'completed', 'failed'),
          defaultValue: 'pending'
      },
      upload_progress: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          validate: {
              min: 0,
              max: 100
          }
      },
      metadata: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Additional metadata like EXIF data'
      },
      isDeleted: {
          type: DataTypes.BOOLEAN,
          field: 'is_deleted',
          defaultValue: false,
          comment: 'Soft delete flag'
      },
      createdBy: {
          type: DataTypes.STRING,
          field: 'created_by',
          allowNull: true,
          comment: 'User who created this record'
      },
      updatedBy: {
          type: DataTypes.STRING,
          field: 'updated_by',
          allowNull: true,
          comment: 'User who last updated this record'
      },
      lastAccessed: {
          type: DataTypes.DATE,
          field: 'last_accessed',
          allowNull: true,
          comment: 'When the file was last accessed'
      },
      tags: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Tags for categorizing the media file'
      },
      isFavorite: {
          type: DataTypes.BOOLEAN,
          field: 'is_favorite',
          defaultValue: false,
          comment: 'Whether the file is marked as favorite'
      },
      viewCount: {
          type: DataTypes.INTEGER,
          field: 'view_count',
          defaultValue: 0,
          comment: 'Number of times the file has been viewed'
      }
  }, {
      tableName: 'media_files',
      underscored: false,
      hooks: {
        afterSync: async (options) => {
          const queryInterface = options.sequelize.getQueryInterface();
          const transaction = await options.sequelize.transaction();
          
          try {
            // Check if the constraint already exists
            const [results] = await queryInterface.sequelize.query(
              `SELECT * FROM information_schema.table_constraints 
               WHERE constraint_schema = DATABASE() 
               AND table_name = 'media_files' 
               AND constraint_name = 'media_files_deviceId_fk'`,
              { transaction }
            );
            
            // Only add the constraint if it doesn't exist
            if (results.length === 0) {
              // Drop any existing foreign key constraints if they exist
              await queryInterface.removeConstraint('media_files', 'media_files_ibfk_1', { transaction }).catch(() => {});
              await queryInterface.removeConstraint('media_files', 'media_files_ibfk_2', { transaction }).catch(() => {});
              
              // Add the correct foreign key constraint
              await queryInterface.addConstraint('media_files', {
                fields: ['deviceId'],
                type: 'foreign key',
                name: 'media_files_deviceId_fk',
                references: {
                  table: 'devices',
                  field: 'deviceId'
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
                transaction
              });
            }
            
            await transaction.commit();
          } catch (error) {
            await transaction.rollback();
            console.error('Error setting up media_files foreign keys:', error);
            throw error; // Re-throw to prevent silent failures
          }
        }
      },
      indexes: [
          {
              fields: ['deviceId']
          },
          {
              fields: ['media_type']
          },
          {
              fields: ['captured_at']
          },
          {
              fields: ['upload_status']
          }
      ]
  });

  // Define associations
  MediaFile.associate = (models) => {
    MediaFile.belongsTo(models.Device, {
      foreignKey: 'deviceId',
      targetKey: 'deviceId',
      as: 'device'
    });
  };

  // Add syncWithDatabase method to handle foreign key constraints
  MediaFile.syncWithDatabase = async (options = {}) => {
    const queryInterface = sequelize.getQueryInterface();
    const transaction = await sequelize.transaction();
    
    try {
      // Drop existing foreign key constraints if they exist
      await queryInterface.removeConstraint('media_files', 'media_files_ibfk_1', { transaction }).catch(() => {});
      await queryInterface.removeConstraint('media_files', 'media_files_ibfk_2', { transaction }).catch(() => {});
      
      // Sync the model without applying indexes first
      await MediaFile.sync({ ...options, transaction, indexes: [] });
      
      // Add the correct foreign key constraint for deviceId
      await queryInterface.addConstraint('media_files', {
        fields: ['deviceId'],
        type: 'foreign key',
        name: 'media_files_deviceId_fk',
        references: { 
          table: 'devices', 
          field: 'deviceId'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        transaction
      });
      
      // Add necessary indexes
      const existingIndexes = await queryInterface.showIndex('media_files', { transaction });
      const hasMediaTypeIndex = existingIndexes.some(idx => idx.name === 'media_files_media_type');
      const hasCreatedAtIndex = existingIndexes.some(idx => idx.name === 'media_files_created_at');
      
      if (!hasMediaTypeIndex) {
        await queryInterface.addIndex('media_files', {
          name: 'media_files_media_type',
          fields: ['media_type'],
          transaction
        });
      }
      
      if (!hasCreatedAtIndex) {
        await queryInterface.addIndex('media_files', {
          name: 'media_files_created_at',
          fields: ['created_at'],
          transaction
        });
      }
      
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      console.error('Error syncing MediaFile model:', error);
      return false;
    }
  };

  return MediaFile;
};
