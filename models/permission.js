const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Permission = sequelize.define('Permission', {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
        },
        key: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        label: {
            type: DataTypes.STRING(150),
            allowNull: false,
        },
        group: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
    }, {
        tableName: 'permissions',
        underscored: true,
    });

    Permission.associate = (models) => {
        Permission.belongsToMany(models.Role, {
            through: models.RolePermission,
            foreignKey: 'permission_id',
            otherKey: 'role_id',
            as: 'roles',
        });
    };

    return Permission;
};
