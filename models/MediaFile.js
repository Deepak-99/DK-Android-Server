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

  return MediaFile;
};
