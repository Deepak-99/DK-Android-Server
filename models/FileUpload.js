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
      field: "device_id"
    },

    filename: {
      type: DataTypes.STRING,
      allowNull: false
    },

    originalName: {
      type: DataTypes.STRING,
      field: "original_name",
      allowNull: false
    },

    filePath: {
      type: DataTypes.STRING,
      field: "file_path",
      allowNull: false
    },

    fileSize: {
      type: DataTypes.BIGINT,
      field: "file_size",
      allowNull: false
    },

    mimeType: {
      type: DataTypes.STRING,
      field: "mime_type",
      allowNull: false
    },

    fileType: {
      type: DataTypes.ENUM("document","image","video","audio","archive","other"),
      field: "file_type",
      allowNull: false
    },

    uploadStatus: {
      type: DataTypes.ENUM("pending","uploading","completed","failed"),
      field: "upload_status",
      defaultValue: "pending"
    },

    uploadProgress: {
      type: DataTypes.INTEGER,
      field: "upload_progress",
      defaultValue: 0
    },

    checksum: DataTypes.STRING,

    metadata: DataTypes.JSON,

    thumbnailPath: {
      type: DataTypes.STRING,
      field: "thumbnail_path"
    },

    isEncrypted: {
      type: DataTypes.BOOLEAN,
      field: "is_encrypted",
      defaultValue: false
    },

    encryptionKey: {
      type: DataTypes.STRING,
      field: "encryption_key"
    },

    downloadCount: {
      type: DataTypes.INTEGER,
      field: "download_count",
      defaultValue: 0
    },

    lastAccessed: {
      type: DataTypes.DATE,
      field: "last_accessed"
    },

    expiresAt: {
      type: DataTypes.DATE,
      field: "expires_at"
    },

    isDeleted: {
      type: DataTypes.BOOLEAN,
      field: "is_deleted",
      defaultValue: false
    }

  }, {
    tableName: "file_uploads",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["device_id"] },
      { fields: ["upload_status"] },
      { fields: ["file_type"] },
      { fields: ["created_at"] },
      { fields: ["expires_at"] }
    ]
  });

  FileUpload.associate = (models) => {
    FileUpload.belongsTo(models.Device, {
      foreignKey: "deviceId",
      targetKey: "deviceId",
      as: "device"
    });
  };

  return FileUpload;
};