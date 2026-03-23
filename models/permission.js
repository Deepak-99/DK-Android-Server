const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

  const Permission = sequelize.define('Permission', {

    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },

    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },

    label: {
      type: DataTypes.STRING(150),
      allowNull: false
    },

    group: DataTypes.STRING(50)

  }, {
    tableName: 'permissions',
    timestamps: true,
    underscored: true
  });

  Permission.associate = (models) => {
    Permission.belongsToMany(models.Role, {
      through: models.RolePermission,
      foreignKey: 'permissionId',
      otherKey: 'roleId',
      as: 'roles'
    });
  };

  return Permission;
};