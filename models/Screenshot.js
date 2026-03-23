module.exports = (sequelize, DataTypes) => {

  const Screenshot = sequelize.define('Screenshot', {

    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },

    deviceId: {
      type: DataTypes.STRING,
      field: 'device_id',
      allowNull: false
    },

    filePath: {
      type: DataTypes.STRING,
      field: 'file_path',
      allowNull: false
    },

    fileName: {
      type: DataTypes.STRING,
      field: 'file_name'
    },

    mimeType: {
      type: DataTypes.STRING,
      field: 'mime_type'
    },

    fileSize: {
      type: DataTypes.BIGINT.UNSIGNED,
      field: 'file_size'
    },

    width: DataTypes.INTEGER,

    height: DataTypes.INTEGER,

    takenAt: {
      type: DataTypes.DATE,
      field: 'taken_at'
    }

  }, {
    tableName: 'screenshots',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['device_id'] },
      { fields: ['device_id', 'taken_at'] },
      { fields: ['created_at'] }
    ]
  });

  Screenshot.associate = (models) => {
    Screenshot.belongsTo(models.Device, {
      foreignKey: 'deviceId',
      targetKey: 'deviceId',
      as: 'device'
    });
  };

  return Screenshot;
};