const express = require('express');
const { Op } = require('sequelize');
const { Device, DynamicConfig } = require('../config/database');
const { authenticateToken, authenticateDevice, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Submit dynamic config data (Device endpoint)
router.post('/push', authenticateDevice, async (req, res) => {
  try {
    const device = await Device.findOne({ where: { device_id: req.deviceId } });
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const { configs } = req.body;
    if (!Array.isArray(configs) || configs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid config data'
      });
    }

    const configData = configs.map(config => ({
      device_id: device.id,
      config_key: config.config_key,
      config_value: config.config_value,
      config_type: config.config_type || 'string',
      category: config.category,
      description: config.description,
      is_sensitive: config.is_sensitive || false,
      is_readonly: config.is_readonly || false,
      default_value: config.default_value,
      validation_rules: config.validation_rules,
      version: config.version || 1,
      is_active: config.is_active !== false
    }));

    // Use upsert to handle duplicates
    const createdConfigs = [];
    for (const configInfo of configData) {
      const [config, created] = await DynamicConfig.findOrCreate({
        where: {
          device_id: device.id,
          config_key: configInfo.config_key
        },
        defaults: configInfo
      });

      if (!created) {
        await config.update(configInfo);
      }
      createdConfigs.push(config);
    }

    logger.info(`Dynamic config data received from device: ${req.deviceId}, count: ${configs.length}`);

    // Emit to admin room
    if (req.io) {
      req.io.to('admin-room').emit('config-updated', {
        device_id: req.deviceId,
        count: createdConfigs.length
      });
    }

    res.json({
      success: true,
      message: `${createdConfigs.length} config entries processed successfully`,
      data: { count: createdConfigs.length }
    });
  } catch (error) {
    logger.error('Submit dynamic config error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Set dynamic config (Admin command)
router.post('/set', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { device_id, config_key, config_value, config_type, category, description, is_sensitive } = req.body;

    const device = await Device.findByPk(device_id);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    // Create or update the config in database
    const [config, created] = await DynamicConfig.findOrCreate({
      where: {
        device_id: device.id,
        config_key
      },
      defaults: {
        device_id: device.id,
        config_key,
        config_value,
        config_type: config_type || 'string',
        category,
        description,
        is_sensitive: is_sensitive || false,
        created_by: req.user.id,
        updated_by: req.user.id,
        version: 1
      }
    });

    if (!created) {
      await config.update({
        config_value,
        config_type: config_type || config.config_type,
        category: category || config.category,
        description: description || config.description,
        is_sensitive: is_sensitive !== undefined ? is_sensitive : config.is_sensitive,
        updated_by: req.user.id,
        version: config.version + 1
      });
    }

    // Send command to device
    const Command = require('../config/database').Command;
    const command = await Command.create({
      device_id: device.id,
      command_type: 'set_dynamic_config',
      command_data: {
        config_key,
        config_value,
        config_type: config_type || 'string'
      },
      priority: 'normal',
      created_by: req.user.id,
      expires_at: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    // Emit to device room
    if (req.io) {
      req.io.to(`device-${device.device_id}`).emit('new-command', {
        command: command.toJSON()
      });
    }

    res.json({
      success: true,
      message: 'Set config command sent',
      data: { 
        command_id: command.id,
        config_id: config.id,
        created: created
      }
    });
  } catch (error) {
    logger.error('Set dynamic config command error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get dynamic config for device (Admin only)
router.get('/device/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 100, category, config_key, is_active } = req.query;
    const offset = (page - 1) * limit;

    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const whereClause = { device_id: device.id };
    
    if (category) {
      whereClause.category = category;
    }

    if (config_key) {
      whereClause.config_key = { [Op.like]: `%${config_key}%` };
    }

    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }

    const { count, rows: configs } = await DynamicConfig.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['category', 'ASC'], ['config_key', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        configs,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_count: count,
          per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get dynamic config error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get global config (Admin only)
router.get('/global', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 100, category, config_key, is_active } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { device_id: null }; // Global configs have null device_id
    
    if (category) {
      whereClause.category = category;
    }

    if (config_key) {
      whereClause.config_key = { [Op.like]: `%${config_key}%` };
    }

    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }

    const { count, rows: configs } = await DynamicConfig.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['category', 'ASC'], ['config_key', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        configs,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_count: count,
          per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get global config error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Set global config (Admin only)
router.post('/global/set', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { config_key, config_value, config_type, category, description, is_sensitive } = req.body;

    // Create or update the global config
    const [config, created] = await DynamicConfig.findOrCreate({
      where: {
        device_id: null,
        config_key
      },
      defaults: {
        device_id: null,
        config_key,
        config_value,
        config_type: config_type || 'string',
        category,
        description,
        is_sensitive: is_sensitive || false,
        created_by: req.user.id,
        updated_by: req.user.id,
        version: 1
      }
    });

    if (!created) {
      await config.update({
        config_value,
        config_type: config_type || config.config_type,
        category: category || config.category,
        description: description || config.description,
        is_sensitive: is_sensitive !== undefined ? is_sensitive : config.is_sensitive,
        updated_by: req.user.id,
        version: config.version + 1
      });
    }

    res.json({
      success: true,
      message: created ? 'Global config created' : 'Global config updated',
      data: { 
        config_id: config.id,
        created: created
      }
    });
  } catch (error) {
    logger.error('Set global config error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get config categories (Admin only)
router.get('/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const categories = await DynamicConfig.findAll({
      attributes: [
        'category',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: { is_active: true },
      group: ['category'],
      order: [['category', 'ASC']]
    });

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    logger.error('Get config categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
