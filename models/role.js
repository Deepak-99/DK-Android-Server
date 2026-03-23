const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

  const Role = sequelize.define('Role', {

    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },

    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },

    description: DataTypes.STRING(255),

    isSystem: {
      type: DataTypes.BOOLEAN,
      field: 'is_system',
      defaultValue: false
    }

  }, {
    tableName: 'roles',
    timestamps: true,
    underscored: true
  });

  Role.associate = (models) => {

    Role.belongsToMany(models.User, {
      through: models.UserRole,
      foreignKey: 'roleId',
      otherKey: 'userId',
      as: 'users'
    });

    Role.belongsToMany(models.Permission, {
      through: models.RolePermission,
      foreignKey: 'roleId',
      otherKey: 'permissionId',
      as: 'permissions'
    });
  };

  return Role;
};