const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

  return sequelize.define('RolePermission', {

      id: {
          type: DataTypes.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
      },

      roleId: {
          type: DataTypes.INTEGER.UNSIGNED,
          field: 'role_id',
          allowNull: false
      },

      permissionId: {
          type: DataTypes.INTEGER.UNSIGNED,
          field: 'permission_id',
          allowNull: false
      }

  }, {
      tableName: 'role_permissions',
      timestamps: true,
      underscored: true
  });
};