// models/UserPermission.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

  const UserPermission = sequelize.define('UserPermission', {

    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    userId: {
      type: DataTypes.INTEGER,
      field: 'user_id',
      allowNull: false
    },

    resource: {
      type: DataTypes.STRING(100),
      allowNull: false
    },

    action: {
      type: DataTypes.ENUM('view','create','update','delete','download','execute'),
      allowNull: false
    },

    allowed: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }

  }, {
    tableName: 'user_permissions',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['user_id','resource','action'], unique: true }
    ]
  });

  UserPermission.associate = (models) => {
    UserPermission.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return UserPermission;
};