const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const UserRole = sequelize.define('UserRole', {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        role_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
    }, {
        tableName: 'user_roles',
        underscored: true,
    });

    UserRole.associate = (models) => {
        UserRole.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        UserRole.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
    };

    return UserRole;
};
