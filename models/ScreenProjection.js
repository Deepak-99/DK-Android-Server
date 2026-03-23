const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

  return sequelize.define('ScreenProjection', {

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

      sessionId: {
          type: DataTypes.STRING,
          field: 'session_id',
          unique: true,
          allowNull: false
      },

      projectionType: {
          type: DataTypes.ENUM('live_stream', 'remote_control', 'view_only'),
          field: 'projection_type',
          defaultValue: 'view_only'
      },

      status: {
          type: DataTypes.ENUM('starting', 'active', 'paused', 'stopped', 'error'),
          defaultValue: 'starting'
      },

      resolution: DataTypes.STRING,

      frameRate: {
          type: DataTypes.INTEGER,
          field: 'frame_rate',
          defaultValue: 15
      },

      quality: {
          type: DataTypes.ENUM('low', 'medium', 'high'),
          defaultValue: 'medium'
      },

      compression: DataTypes.INTEGER,

      viewerCount: {
          type: DataTypes.INTEGER,
          field: 'viewer_count',
          defaultValue: 0
      },

      maxViewers: {
          type: DataTypes.INTEGER,
          field: 'max_viewers',
          defaultValue: 5
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

      duration: DataTypes.INTEGER,

      bytesTransmitted: {
          type: DataTypes.BIGINT,
          field: 'bytes_transmitted',
          defaultValue: 0
      },

      framesTransmitted: {
          type: DataTypes.INTEGER,
          field: 'frames_transmitted',
          defaultValue: 0
      },

      connectionInfo: {
          type: DataTypes.JSON,
          field: 'connection_info'
      },

      viewerSessions: {
          type: DataTypes.JSON,
          field: 'viewer_sessions'
      },

      settings: DataTypes.JSON,

      errorMessage: {
          type: DataTypes.TEXT,
          field: 'error_message'
      },

      lastFrameTime: {
          type: DataTypes.DATE,
          field: 'last_frame_time'
      },

      isRecording: {
          type: DataTypes.BOOLEAN,
          field: 'is_recording',
          defaultValue: false
      },

      recordingPath: {
          type: DataTypes.STRING,
          field: 'recording_path'
      },

      accessToken: {
          type: DataTypes.STRING,
          field: 'access_token'
      },

      isPublic: {
          type: DataTypes.BOOLEAN,
          field: 'is_public',
          defaultValue: false
      },

      metadata: DataTypes.JSON

  }, {
      tableName: 'screen_projections',
      timestamps: true,
      underscored: true
  });
};