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
      allowNull: true,
      field: 'deviceId',
      references: {
        model: 'devices',
        key: 'deviceId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      comment: 'Null for global config, specific device ID for device-specific config (references devices.deviceId)'
    },
    config_key: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Configuration key identifier'
    },
    config_value: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Configuration value (can be JSON string)'
    },
    config_type: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json', 'array'),
      allowNull: false,
      defaultValue: 'string'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Configuration category (e.g., app_settings, security, features)'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of what this config does'
    },
    is_sensitive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this config contains sensitive data'
    },
    is_readonly: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this config can be modified'
    },
    default_value: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Default value for this configuration'
    },
    validation_rules: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Validation rules for the config value'
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User who created this config'
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User who last updated this config'
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Configuration version for tracking changes'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this config is currently active'
    }
  }, {
    tableName: 'dynamic_config',
    timestamps: true,
    underscored: false,
    indexes: [
      {
        name: 'idx_dynamic_config_deviceId',
        fields: ['deviceId']
      },
      {
        name: 'idx_dynamic_config_key',
        fields: ['config_key']
      },
      {
        name: 'idx_dynamic_config_category',
        fields: ['category']
      },
      {
        name: 'idx_dynamic_config_active',
        fields: ['is_active']
      },
      {
        name: 'idx_dynamic_config_created_at',
        fields: ['created_at']
      },
      {
        name: 'idx_dynamic_config_updated_at',
        fields: ['updated_at']
      },
      {
        name: 'idx_dynamic_config_unique',
        fields: ['config_key', 'deviceId'],
        unique: true,
        where: {
            deviceId: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      },
      {
        name: 'idx_dynamic_config_global_unique',
        fields: ['config_key'],
        unique: true,
        where: {
            deviceId: null
        }
      }
    ],

  });

  return DynamicConfig;
};
