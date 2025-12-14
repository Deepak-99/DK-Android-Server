const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Role = sequelize.define('Role', {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        is_system: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    }, {
        tableName: 'roles',
        underscored: true,
    });

    Role.associate = (models) => {
        Role.belongsToMany(models.User, {
            through: models.UserRole,
            foreignKey: 'role_id',
            otherKey: 'user_id',
            as: 'users',
        });
        Role.belongsToMany(models.Permission, {
            through: models.RolePermission,
            foreignKey: 'role_id',
            otherKey: 'permission_id',
            as: 'permissions',
        });
    };

    return Role;
};
