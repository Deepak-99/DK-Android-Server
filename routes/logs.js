const express = require('express');
const router = express.Router();
const LogAnalyzer = require('../utils/logAnalyzer');
const logger = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');

const logAnalyzer = new LogAnalyzer();

/**
 * Log Analysis API Routes for DK Hawkshaw Server
 * Provides comprehensive log analysis and monitoring endpoints
 */

// Get log statistics and overview
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = logger.getLogStats();
    const availableDates = logAnalyzer.getAvailableLogDates();
    
    res.json({
      success: true,
      data: {
        ...stats,
        availableDates,
        totalLogDays: availableDates.length
      }
    });
  } catch (error) {
    logger.logError(error, { endpoint: '/logs/stats' });
    res.status(500).json({
      success: false,
      error: 'Failed to get log statistics'
    });
  }
});

// Get daily report for specific date
router.get('/daily/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }
    
    const report = await logAnalyzer.generateDailyReport(date);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.logError(error, { endpoint: '/logs/daily', date: req.params.date });
    res.status(500).json({
      success: false,
      error: 'Failed to generate daily report'
    });
  }
});

// Get request statistics for specific date
router.get('/requests/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }
    
    const requestStats = await logAnalyzer.getRequestStats(date);
    
    res.json({
      success: true,
      data: requestStats
    });
  } catch (error) {
    logger.logError(error, { endpoint: '/logs/requests', date: req.params.date });
    res.status(500).json({
      success: false,
      error: 'Failed to get request statistics'
    });
  }
});

// Get error analysis for specific date
router.get('/errors/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }
    
    const errorAnalysis = await logAnalyzer.getErrorAnalysis(date);
    
    res.json({
      success: true,
      data: errorAnalysis
    });
  } catch (error) {
    logger.logError(error, { endpoint: '/logs/errors', date: req.params.date });
    res.status(500).json({
      success: false,
      error: 'Failed to get error analysis'
    });
  }
});

// Get performance metrics for specific date
router.get('/performance/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }
    
    const performanceMetrics = await logAnalyzer.getPerformanceMetrics(date);
    
    res.json({
      success: true,
      data: performanceMetrics
    });
  } catch (error) {
    logger.logError(error, { endpoint: '/logs/performance', date: req.params.date });
    res.status(500).json({
      success: false,
      error: 'Failed to get performance metrics'
    });
  }
});

// Get device analytics for specific date
router.get('/devices/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }
    
    const deviceAnalytics = await logAnalyzer.getDeviceAnalytics(date);
    
    res.json({
      success: true,
      data: deviceAnalytics
    });
  } catch (error) {
    logger.logError(error, { endpoint: '/logs/devices', date: req.params.date });
    res.status(500).json({
      success: false,
      error: 'Failed to get device analytics'
    });
  }
});

// Get available log dates
router.get('/dates', authenticateToken, async (req, res) => {
  try {
    const availableDates = logAnalyzer.getAvailableLogDates();
    
    res.json({
      success: true,
      data: {
        dates: availableDates,
        count: availableDates.length,
        latest: availableDates[0] || null,
        oldest: availableDates[availableDates.length - 1] || null
      }
    });
  } catch (error) {
    logger.logError(error, { endpoint: '/logs/dates' });
    res.status(500).json({
      success: false,
      error: 'Failed to get available dates'
    });
  }
});

// Clean old logs
router.post('/cleanup', authenticateToken, async (req, res) => {
  try {
    const { daysToKeep = 30 } = req.body;
    
    if (typeof daysToKeep !== 'number' || daysToKeep < 1) {
      return res.status(400).json({
        success: false,
        error: 'daysToKeep must be a positive number'
      });
    }
    
    const deletedFiles = logAnalyzer.cleanOldLogs(daysToKeep);
    
    logger.info('Log cleanup completed', {
      type: 'log_cleanup',
      daysToKeep,
      deletedFiles,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      data: {
        deletedFiles,
        daysToKeep,
        message: `Cleaned up ${deletedFiles} old log files`
      }
    });
  } catch (error) {
    logger.logError(error, { endpoint: '/logs/cleanup' });
    res.status(500).json({
      success: false,
      error: 'Failed to clean up logs'
    });
  }
});

// Get real-time system metrics
router.get('/system/metrics', authenticateToken, (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid
    };
    
    logger.logSystemMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.logError(error, { endpoint: '/logs/system/metrics' });
    res.status(500).json({
      success: false,
      error: 'Failed to get system metrics'
    });
  }
});

// Search logs by criteria
router.post('/search', authenticateToken, async (req, res) => {
  try {
    const { 
      date, 
      type, 
      deviceId, 
      level, 
      limit = 100,
      offset = 0 
    } = req.body;
    
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Valid date (YYYY-MM-DD) is required'
      });
    }
    
    // This is a basic implementation - you can enhance it based on your needs
    const logFile = path.join('logs', 'daily', `combined-${date}.log`);
    const logs = await logAnalyzer.parseLogFile(logFile);
    
    let filteredLogs = logs;
    
    if (type) {
      filteredLogs = filteredLogs.filter(log => log.type === type);
    }
    
    if (deviceId) {
      filteredLogs = filteredLogs.filter(log => log.deviceId === deviceId);
    }
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    const totalResults = filteredLogs.length;
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);
    
    res.json({
      success: true,
      data: {
        logs: paginatedLogs,
        pagination: {
          total: totalResults,
          limit,
          offset,
          hasMore: offset + limit < totalResults
        }
      }
    });
  } catch (error) {
    logger.logError(error, { endpoint: '/logs/search' });
    res.status(500).json({
      success: false,
      error: 'Failed to search logs'
    });
  }
});

module.exports = router;
