const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    return sequelize.define('NormalizedEvent', {

        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },

        deviceId: {
            type: DataTypes.STRING,
            field: 'device_id'
        },

        type: DataTypes.STRING,

        source: DataTypes.STRING,

        app: DataTypes.STRING,

        signal: DataTypes.STRING,

        confidence: DataTypes.FLOAT,

        meta: DataTypes.JSON,

        timestamp: DataTypes.BIGINT

    }, {
        tableName: 'normalized_events',
        timestamps: true,
        underscored: true
    });
};