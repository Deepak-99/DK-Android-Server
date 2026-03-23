const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

  const MediaFile = sequelize.define('MediaFile', {

    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },

    deviceId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'device_id'
    },

    filename: {
      type: DataTypes.STRING,
      allowNull: false
    },

    originalName: {
      type: DataTypes.STRING,
      field: 'original_name',
      allowNull: false
    },

    filePath: {
      type: DataTypes.STRING,
      field: 'file_path',
      allowNull: false
    },

    fileSize: {
      type: DataTypes.BIGINT,
      field: 'file_size',
      allowNull: false
    },

    mimeType: {
      type: DataTypes.STRING,
      field: 'mime_type',
      allowNull: false
    },

    mediaType: {
      type: DataTypes.ENUM('image','video','audio','document','other'),
      field: 'media_type',
      allowNull: false
    },

    duration: DataTypes.INTEGER,

    width: DataTypes.INTEGER,

    height: DataTypes.INTEGER,

    thumbnailPath: {
      type: DataTypes.STRING,
      field: 'thumbnail_path'
    },

    capturedAt: {
      type: DataTypes.DATE,
      field: 'captured_at'
    },

    locationLatitude: {
      type: DataTypes.DECIMAL(10, 8),
      field: 'location_latitude'
    },

    locationLongitude: {
      type: DataTypes.DECIMAL(11, 8),
      field: 'location_longitude'
    },

    uploadStatus: {
      type: DataTypes.ENUM('pending','uploading','completed','failed'),
      field: 'upload_status',
      defaultValue: 'pending'
    },

    uploadProgress: {
      type: DataTypes.INTEGER,
      field: 'upload_progress',
      defaultValue: 0
    },

    metadata: DataTypes.JSON,

    isDeleted: {
      type: DataTypes.BOOLEAN,
      field: 'is_deleted',
      defaultValue: false
    },

    createdBy: {
      type: DataTypes.STRING,
      field: 'created_by'
    },

    updatedBy: {
      type: DataTypes.STRING,
      field: 'updated_by'
    },

    lastAccessed: {
      type: DataTypes.DATE,
      field: 'last_accessed'
    },

    tags: DataTypes.JSON,

    isFavorite: {
      type: DataTypes.BOOLEAN,
      field: 'is_favorite',
      defaultValue: false
    },

    viewCount: {
      type: DataTypes.INTEGER,
      field: 'view_count',
      defaultValue: 0
    }

  }, {
    tableName: 'media_files',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['device_id'] },
      { fields: ['media_type'] },
      { fields: ['captured_at'] },
      { fields: ['upload_status'] }
    ]
  });

  MediaFile.associate = (models) => {
    MediaFile.belongsTo(models.Device, {
      foreignKey: 'deviceId',
      targetKey: 'deviceId',
      as: 'device'
    });
  };

  return MediaFile;
};