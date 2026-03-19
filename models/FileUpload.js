const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {

  const FileUpload = sequelize.define("FileUpload", {

    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    deviceId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "deviceId",
      comment: "Reference to devices.deviceId"
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
      allowNull: false
    },

    mime_type: {
      type: DataTypes.STRING,
      allowNull: false
    },

    file_type: {
      type: DataTypes.ENUM(
        "document",
        "image",
        "video",
        "audio",
        "archive",
        "other"
      ),
      allowNull: false
    },

    upload_status: {
      type: DataTypes.ENUM(
        "pending",
        "uploading",
        "completed",
        "failed"
      ),
      defaultValue: "pending"
    },

    upload_progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    checksum: {
      type: DataTypes.STRING
    },

    metadata: {
      type: DataTypes.JSON
    },

    thumbnail_path: {
      type: DataTypes.STRING
    },

    is_encrypted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    encryption_key: {
      type: DataTypes.STRING
    },

    download_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    last_accessed: {
      type: DataTypes.DATE
    },

    expires_at: {
      type: DataTypes.DATE
    },

    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }

  }, {

    tableName: "file_uploads",
    timestamps: true,

    indexes: [
      { name: "idx_file_uploads_device_id", fields: ["deviceId"] },
      { name: "idx_file_uploads_upload_status", fields: ["upload_status"] },
      { name: "idx_file_uploads_file_type", fields: ["file_type"] },
      { name: "idx_file_uploads_created_at", fields: ["created_at"] },
      { name: "idx_file_uploads_expires_at", fields: ["expires_at"] }
    ]

  });

  FileUpload.associate = function(models) {

    FileUpload.belongsTo(models.Device, {
      foreignKey: "deviceId",
      targetKey: "deviceId",
      as: "device",
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    });

  };

  return FileUpload;

};