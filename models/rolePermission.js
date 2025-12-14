const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('RolePermission', {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
        },
        role_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        permission_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
    }, {
        tableName: 'role_permissions',
        underscored: true,
    });
};
