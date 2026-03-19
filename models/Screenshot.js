module.exports = (sequelize, DataTypes) => {

    const Screenshot = sequelize.define('Screenshot', {

        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },

        deviceId: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'deviceId',
            references: {
                model: 'devices',
                key: 'deviceId'
            }
        },

        filePath: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'file_path'
        },

        fileName: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'file_name'
        },

        mimeType: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'mime_type'
        },

        fileSize: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
            field: 'file_size'
        },

        width: {
            type: DataTypes.INTEGER,
            allowNull: true
        },

        height: {
            type: DataTypes.INTEGER,
            allowNull: true
        },

        takenAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'taken_at'
        },

        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'created_at'
        },

        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'updated_at'
        }

    }, {

        tableName: 'screenshots',
        timestamps: true,
        underscored: true,

        indexes: [
            {
                name: 'idx_screenshot_device',
                fields: ['deviceId']
            },
            {
                name: 'idx_screenshot_device_taken',
                fields: ['device_id', 'taken_at']
            },
            {
                name: 'idx_screenshot_created',
                fields: ['created_at']
            }
        ]

    });

    Screenshot.associate = models => {

        Screenshot.belongsTo(models.Device, {
            foreignKey: 'deviceId',
            targetKey: 'deviceId',
            as: 'device'
        });

    };

    return Screenshot;

};