const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

  return sequelize.define('ScreenRecording', {

      id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
      },

      deviceId: {
          type: DataTypes.STRING,
          field: 'device_id',
          allowNull: false
      },

      recordingId: {
          type: DataTypes.STRING,
          field: 'recording_id',
          unique: true,
          allowNull: false
      },

      fileName: {
          type: DataTypes.STRING,
          field: 'file_name',
          allowNull: false
      },

      filePath: {
          type: DataTypes.STRING,
          field: 'file_path',
          allowNull: false
      },

      fileSize: {
          type: DataTypes.BIGINT,
          field: 'file_size'
      },

      duration: DataTypes.INTEGER,

      resolution: DataTypes.STRING,

      frameRate: {
          type: DataTypes.INTEGER,
          field: 'frame_rate',
          defaultValue: 30
      },

      bitRate: {
          type: DataTypes.INTEGER,
          field: 'bit_rate'
      },

      format: {
          type: DataTypes.STRING,
          defaultValue: 'mp4'
      },

      quality: {
          type: DataTypes.ENUM('low', 'medium', 'high', 'ultra'),
          defaultValue: 'medium'
      },

      recordingType: {
          type: DataTypes.ENUM('manual', 'scheduled', 'triggered'),
          field: 'recording_type',
          defaultValue: 'manual'
      },

      status: {
          type: DataTypes.ENUM('recording', 'completed', 'failed', 'processing'),
          defaultValue: 'recording'
      },

      startTime: {
          type: DataTypes.DATE,
          field: 'start_time',
          defaultValue: DataTypes.NOW
      },

      endTime: {
          type: DataTypes.DATE,
          field: 'end_time'
      },

      thumbnailPath: {
          type: DataTypes.STRING,
          field: 'thumbnail_path'
      },

      metadata: DataTypes.JSON,

      encryptionKey: {
          type: DataTypes.STRING,
          field: 'encryption_key'
      },

      isEncrypted: {
          type: DataTypes.BOOLEAN,
          field: 'is_encrypted',
          defaultValue: false
      },

      uploadStatus: {
          type: DataTypes.ENUM('pending', 'uploading', 'completed', 'failed'),
          field: 'upload_status',
          defaultValue: 'pending'
      },

      uploadProgress: {
          type: DataTypes.INTEGER,
          field: 'upload_progress',
          defaultValue: 0
      },

      errorMessage: {
          type: DataTypes.TEXT,
          field: 'error_message'
      },

      tags: DataTypes.JSON,

      isDeleted: {
          type: DataTypes.BOOLEAN,
          field: 'is_deleted',
          defaultValue: false
      },

      createdBy: {
          type: DataTypes.STRING,
          field: 'created_by'
      },

      viewCount: {
          type: DataTypes.INTEGER,
          field: 'view_count',
          defaultValue: 0
      }

  }, {
      tableName: 'screen_recordings',
      timestamps: true,
      paranoid: true,
      underscored: true
  });
};