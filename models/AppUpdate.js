const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  const AppUpdate = sequelize.define('AppUpdate', {

    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    version: {
      type: DataTypes.STRING,
      allowNull: false
    },

    versionCode: {
      type: DataTypes.INTEGER,
      field: 'version_code',
      allowNull: false
    },

    channel: {
      type: DataTypes.ENUM('stable','beta','alpha'),
      defaultValue: 'stable'
    },

    filePath: {
      type: DataTypes.STRING,
      field: 'file_path',
      allowNull: false
    },

    fileName: {
      type: DataTypes.STRING,
      field: 'file_name',
      allowNull: false
    },

    fileSize: {
      type: DataTypes.BIGINT,
      field: 'file_size',
      allowNull: false
    },

    checksum: DataTypes.STRING,

    releaseNotes: {
      type: DataTypes.TEXT,
      field: 'release_notes'
    },

    isRequired: {
      type: DataTypes.BOOLEAN,
      field: 'is_required',
      defaultValue: false
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      field: 'is_active',
      defaultValue: true
    },

    rolloutPercentage: {
      type: DataTypes.INTEGER,
      field: 'rollout_percentage',
      defaultValue: 100
    },

    minSdkVersion: {
      type: DataTypes.INTEGER,
      field: 'min_sdk_version',
      defaultValue: 21
    },

    downloadCount: {
      type: DataTypes.INTEGER,
      field: 'download_count',
      defaultValue: 0
    },

    installCount: {
      type: DataTypes.INTEGER,
      field: 'install_count',
      defaultValue: 0
    },

    uploadedBy: {
      type: DataTypes.STRING,
      field: 'uploaded_by'
    },

    uploadDate: {
      type: DataTypes.DATE,
      field: 'upload_date',
      defaultValue: DataTypes.NOW
    },

    isDeleted: {
      type: DataTypes.BOOLEAN,
      field: 'is_deleted',
      defaultValue: false
    }

  }, {
    tableName: 'app_updates',
    timestamps: true,
    underscored: true
  });

  // 🔹 Class methods
  AppUpdate.getLatestVersion = function(channel = 'stable') {
    return this.findOne({
      where: { channel, is_active: true },
      order: [['version_code', 'DESC']]
    });
  };

  AppUpdate.getAvailableUpdate = function(currentVersionCode) {
    return this.findOne({
      where: {
        version_code: { [Op.gt]: currentVersionCode },
        is_active: true
      },
      order: [['version_code', 'ASC']]
    });
  };

  return AppUpdate;
};