const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    const CallLog = sequelize.define('CallLog', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        deviceId: {
            type: DataTypes.STRING,
            field: 'deviceId',
            allowNull: false,
            references: {
                model: 'devices',
                key: 'deviceId',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE'
            },
            comment: 'Reference to devices table (deviceId)'
        },
        call_id: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Call ID from Android device'
        },
        number: {
            type: DataTypes.STRING,
            field: 'number',
            allowNull: false,
            comment: 'Phone number'
        },
        date: {
            type: DataTypes.DATE,
            field: 'date',
            allowNull: false,
            comment: 'Date and time of call'
        },
        duration: {
            type: DataTypes.INTEGER,
            field: 'duration',
            allowNull: false,
            comment: 'Call duration in seconds'
        },
        type: {
            type: DataTypes.ENUM('incoming', 'outgoing', 'missed', 'voicemail', 'rejected', 'blocked'),
            field: 'type',
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Contact name if available'
        },
        number_type: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Type of number (mobile, home, work, etc.)'
        },
        number_label: {
            type: DataTypes.STRING,
            allowNull: true
        },
        country_iso: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Country ISO code'
        },
        data_usage: {
            type: DataTypes.BIGINT,
            allowNull: true,
            comment: 'Data usage in bytes'
        },
        features: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Call features bitmask'
        },
        geocoded_location: {
            type: DataTypes.STRING,
            allowNull: true
        },
        is_read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        new: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        phone_account_id: {
            type: DataTypes.STRING,
            allowNull: true
        },
        via_number: {
            type: DataTypes.STRING,
            allowNull: true
        },
        sync_timestamp: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        is_deleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'call_logs',
        timestamps: false
    });

    // ✅ Associations ONLY (no DB changes)
    CallLog.associate = function(models) {
        CallLog.belongsTo(models.Device, {
            foreignKey: 'deviceId',
            targetKey: 'deviceId'
        });
    };

    return CallLog;  // ⭐ THIS WAS MISSING
};