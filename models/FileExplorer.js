const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

  const FileExplorer = sequelize.define('FileExplorer', {

    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    deviceId: {
      type: DataTypes.STRING,
      field: 'device_id',
      allowNull: false
    },

    filePath: {
      type: DataTypes.STRING(1024),
      field: 'file_path',
      allowNull: false
    },

    fileName: {
      type: DataTypes.STRING,
      field: 'file_name',
      allowNull: false
    },

    parentPath: {
      type: DataTypes.STRING,
      field: 'parent_path'
    },

    fileType: {
      type: DataTypes.ENUM('file','directory','symlink','unknown'),
      field: 'file_type',
      allowNull: false
    },

    fileSize: {
      type: DataTypes.BIGINT,
      field: 'file_size'
    },

    mimeType: {
      type: DataTypes.STRING,
      field: 'mime_type'
    },

    lastModified: {
      type: DataTypes.DATE,
      field: 'last_modified'
    },

    permissions: DataTypes.STRING,
    owner: DataTypes.STRING,
    group: DataTypes.STRING,

    isHidden: {
      type: DataTypes.BOOLEAN,
      field: 'is_hidden',
      defaultValue: false
    },

    isReadable: {
      type: DataTypes.BOOLEAN,
      field: 'is_readable',
      defaultValue: true
    },

    isWritable: {
      type: DataTypes.BOOLEAN,
      field: 'is_writable',
      defaultValue: false
    },

    isExecutable: {
      type: DataTypes.BOOLEAN,
      field: 'is_executable',
      defaultValue: false
    },

    thumbnailPath: {
      type: DataTypes.STRING,
      field: 'thumbnail_path'
    },

    metadata: DataTypes.JSON,

    scanTimestamp: {
      type: DataTypes.DATE,
      field: 'scan_timestamp',
      defaultValue: DataTypes.NOW
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      field: 'is_active',
      defaultValue: true
    }

  }, {
    tableName: 'file_explorer',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['device_id'] },
      {
        name: 'file_explorer_file_path_device_id',
        unique: true,
        fields: [
          { name: 'file_path', length: 191 },
          'device_id'
        ]
      },
      { fields: ['parent_path'] },
      { fields: ['file_type'] },
      { fields: ['last_modified'] }
    ]
  });

  FileExplorer.associate = (models) => {
    FileExplorer.belongsTo(models.Device, {
      foreignKey: 'deviceId',
      targetKey: 'deviceId',
      as: 'device'
    });
  };

  return FileExplorer;
};