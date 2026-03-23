const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

  const UserRole = sequelize.define('UserRole', {

    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },

    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      field: 'user_id',
      allowNull: false
    },

    roleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      field: 'role_id',
      allowNull: false
    }

  }, {
    tableName: 'user_roles',
    timestamps: true,
    underscored: true
  });

  UserRole.associate = (models) => {

    UserRole.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    UserRole.belongsTo(models.Role, {
      foreignKey: 'roleId',
      as: 'role'
    });

  };

  return UserRole;
};