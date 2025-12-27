module.exports = (sequelize, DataTypes) => {
    return sequelize.define('NormalizedEvent', {
      device_id: DataTypes.INTEGER,
      type: DataTypes.STRING,
      source: DataTypes.STRING,
      app: DataTypes.STRING,
      signal: DataTypes.STRING,
      confidence: DataTypes.FLOAT,
      meta: DataTypes.JSON,
      timestamp: DataTypes.BIGINT
  }, {
      tableName: 'normalized_events',
      underscored: true,
      timestamps: true
  });
};