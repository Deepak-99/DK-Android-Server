const { Device, Command, CallRecording } = require('../models');
const { Op } = require('sequelize');

const dashboardController = {
  getOverview: async (req, res) => {
    try {
      // Get total number of devices
      const totalDevices = await Device.count();
      
      // Get online devices count (assuming isOnline is a boolean field)
      const onlineDevices = await Device.count({
        where: { isOnline: true }
      });

      // Get recent commands (last 10)
      const recentCommands = await Command.findAll({
        order: [['createdAt', 'DESC']],
        limit: 10,
        include: [{
          model: Device,
          attributes: ['deviceId', 'name']
        }]
      });

      // Get command statistics
      const commandStats = await Command.findAll({
        attributes: [
          'command_type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['command_type'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 5
      });

      // Get device status distribution
      const deviceStatus = await Device.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      });

      res.json({
        success: true,
        data: {
          totalDevices,
          onlineDevices,
          offlineDevices: totalDevices - onlineDevices,
          recentCommands,
          commandStats,
          deviceStatus
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data',
        error: error.message
      });
    }
  }
};

module.exports = dashboardController;
