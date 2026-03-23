const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

  const DynamicConfig = sequelize.define('DynamicConfig', {

    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    deviceId: {
      type: DataTypes.STRING,
      field: 'device_id',
      allowNull: true
    },

    configKey: {
      type: DataTypes.STRING,
      field: 'config_key',
      allowNull: false
    },

    configValue: {
      type: DataTypes.TEXT,
      field: 'config_value'
    },

    configType: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json', 'array'),
      field: 'config_type',
      defaultValue: 'string'
    },

    category: DataTypes.STRING,

    description: DataTypes.TEXT,

    isSensitive: {
      type: DataTypes.BOOLEAN,
      field: 'is_sensitive',
      defaultValue: false
    },

    isReadonly: {
      type: DataTypes.BOOLEAN,
      field: 'is_readonly',
      defaultValue: false
    },

    defaultValue: {
      type: DataTypes.TEXT,
      field: 'default_value'
    },

    validationRules: {
      type: DataTypes.JSON,
      field: 'validation_rules'
    },

    createdBy: {
      type: DataTypes.UUID,
      field: 'created_by'
    },

    updatedBy: {
      type: DataTypes.UUID,
      field: 'updated_by'
    },

    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      field: 'is_active',
      defaultValue: true
    }

  }, {
    tableName: 'dynamic_config',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['device_id'] },
      { fields: ['config_key'] },
      { fields: ['category'] },
      { fields: ['is_active'] },
      { fields: ['created_at'] },
      { fields: ['updated_at'] }
    ]
  });

  return DynamicConfig;
};