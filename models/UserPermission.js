// models/UserPermission.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const UserPermission = sequelize.define(
        'UserPermission',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                field: 'user_id',
            },
            resource: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            action: {
                type: DataTypes.ENUM(
                    'view',
                    'create',
                    'update',
                    'delete',
                    'download',
                    'execute'
                ),
                allowNull: false,
            },
            allowed: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
        },
        {
            tableName: 'user_permissions',
            timestamps: true,
            underscored: true,
            indexes: [
                {
                    name: 'idx_user_permissions_user',
                    fields: ['user_id'],
                },
                {
                    name: 'idx_user_permissions_unique',
                    unique: true,
                    fields: ['user_id', 'resource', 'action'],
                },
            ],
        }
    );

    UserPermission.associate = (models) => {
        if (models.User) {
            UserPermission.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            });
        }
    };

    return UserPermission;
};
