const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Log Analysis Utilities for DK Hawkshaw Server
 * Provides comprehensive analysis tools for server logs
 */

class LogAnalyzer {
  constructor(logDir = 'logs') {
    this.logDir = logDir;
    this.analyticsDir = path.join(logDir, 'analytics');
    this.dailyDir = path.join(logDir, 'daily');
    this.errorDir = path.join(logDir, 'errors');
    this.performanceDir = path.join(logDir, 'performance');
  }

  /**
   * Parse log files and extract structured data
   */
  async parseLogFile(filePath) {
    const logs = [];
    
    if (!fs.existsSync(filePath)) {
      return logs;
    }

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      try {
        const logEntry = JSON.parse(line);
        logs.push(logEntry);
      } catch (error) {
        // Skip invalid JSON lines
        console.warn(`Invalid JSON in log file ${filePath}: ${line}`);
      }
    }

    return logs;
  }

  /**
   * Get request statistics for a specific date
   */
  async getRequestStats(date) {
    const logFile = path.join(this.dailyDir, `combined-${date}.log`);
    const logs = await this.parseLogFile(logFile);
    
    const requestLogs = logs.filter(log => log.type === 'request');
    
    const stats = {
      totalRequests: requestLogs.length,
      successfulRequests: requestLogs.filter(log => log.statusCode < 400).length,
      errorRequests: requestLogs.filter(log => log.statusCode >= 400).length,
      averageResponseTime: 0,
      methodBreakdown: {},
      statusCodeBreakdown: {},
      topEndpoints: {},
      deviceActivity: {},
      hourlyDistribution: Array(24).fill(0)
    };

    if (requestLogs.length > 0) {
      // Calculate average response time
      const totalResponseTime = requestLogs.reduce((sum, log) => sum + (log.responseTime || 0), 0);
      stats.averageResponseTime = Math.round(totalResponseTime / requestLogs.length);

      // Method breakdown
      requestLogs.forEach(log => {
        stats.methodBreakdown[log.method] = (stats.methodBreakdown[log.method] || 0) + 1;
      });

      // Status code breakdown
      requestLogs.forEach(log => {
        stats.statusCodeBreakdown[log.statusCode] = (stats.statusCodeBreakdown[log.statusCode] || 0) + 1;
      });

      // Top endpoints
      requestLogs.forEach(log => {
        const endpoint = log.path || log.url;
        stats.topEndpoints[endpoint] = (stats.topEndpoints[endpoint] || 0) + 1;
      });

      // Device activity
      requestLogs.forEach(log => {
        const deviceId = log.deviceId || 'unknown';
        stats.deviceActivity[deviceId] = (stats.deviceActivity[deviceId] || 0) + 1;
      });

      // Hourly distribution
      requestLogs.forEach(log => {
        const hour = new Date(log.timestamp).getHours();
        stats.hourlyDistribution[hour]++;
      });
    }

    return stats;
  }

  /**
   * Get error analysis for a specific date
   */
  async getErrorAnalysis(date) {
    const errorFile = path.join(this.errorDir, `errors-${date}.log`);
    const logs = await this.parseLogFile(errorFile);
    
    const analysis = {
      totalErrors: logs.length,
      errorTypes: {},
      errorsByEndpoint: {},
      errorsByDevice: {},
      criticalErrors: [],
      hourlyDistribution: Array(24).fill(0)
    };

    logs.forEach(log => {
      // Error types
      const errorType = log.name || log.type || 'Unknown';
      analysis.errorTypes[errorType] = (analysis.errorTypes[errorType] || 0) + 1;

      // Errors by endpoint
      if (log.context && log.context.path) {
        analysis.errorsByEndpoint[log.context.path] = (analysis.errorsByEndpoint[log.context.path] || 0) + 1;
      }

      // Errors by device
      const deviceId = log.context?.deviceId || 'unknown';
      analysis.errorsByDevice[deviceId] = (analysis.errorsByDevice[deviceId] || 0) + 1;

      // Critical errors (500+ status codes)
      if (log.context && log.context.statusCode >= 500) {
        analysis.criticalErrors.push(log);
      }

      // Hourly distribution
      const hour = new Date(log.timestamp).getHours();
      analysis.hourlyDistribution[hour]++;
    });

    return analysis;
  }

  /**
   * Get performance metrics for a specific date
   */
  async getPerformanceMetrics(date) {
    const perfFile = path.join(this.performanceDir, `performance-${date}.log`);
    const logs = await this.parseLogFile(perfFile);
    
    const requestLogs = logs.filter(log => log.type === 'request');
    const systemLogs = logs.filter(log => log.type === 'system_metrics');
    
    const metrics = {
      responseTimeStats: {
        min: 0,
        max: 0,
        average: 0,
        median: 0,
        p95: 0,
        p99: 0
      },
      slowestEndpoints: [],
      systemMetrics: {
        averageMemoryUsage: 0,
        peakMemoryUsage: 0,
        averageUptime: 0
      }
    };

    if (requestLogs.length > 0) {
      const responseTimes = requestLogs
        .map(log => log.responseTime || 0)
        .filter(time => time > 0)
        .sort((a, b) => a - b);

      if (responseTimes.length > 0) {
        metrics.responseTimeStats.min = responseTimes[0];
        metrics.responseTimeStats.max = responseTimes[responseTimes.length - 1];
        metrics.responseTimeStats.average = Math.round(
          responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        );
        metrics.responseTimeStats.median = responseTimes[Math.floor(responseTimes.length / 2)];
        metrics.responseTimeStats.p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
        metrics.responseTimeStats.p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];
      }

      // Slowest endpoints
      const endpointTimes = {};
      requestLogs.forEach(log => {
        const endpoint = log.path || log.url;
        if (!endpointTimes[endpoint]) {
          endpointTimes[endpoint] = [];
        }
        endpointTimes[endpoint].push(log.responseTime || 0);
      });

      metrics.slowestEndpoints = Object.entries(endpointTimes)
        .map(([endpoint, times]) => ({
          endpoint,
          averageTime: Math.round(times.reduce((sum, time) => sum + time, 0) / times.length),
          maxTime: Math.max(...times),
          requestCount: times.length
        }))
        .sort((a, b) => b.averageTime - a.averageTime)
        .slice(0, 10);
    }

    if (systemLogs.length > 0) {
      const memoryUsages = systemLogs.map(log => log.memory?.heapUsed || 0);
      const uptimes = systemLogs.map(log => log.uptime || 0);

      metrics.systemMetrics.averageMemoryUsage = Math.round(
        memoryUsages.reduce((sum, mem) => sum + mem, 0) / memoryUsages.length
      );
      metrics.systemMetrics.peakMemoryUsage = Math.max(...memoryUsages);
      metrics.systemMetrics.averageUptime = Math.round(
        uptimes.reduce((sum, uptime) => sum + uptime, 0) / uptimes.length
      );
    }

    return metrics;
  }

  /**
   * Get device analytics for a specific date
   */
  async getDeviceAnalytics(date) {
    const analyticsFile = path.join(this.analyticsDir, `analytics-${date}.log`);
    const logs = await this.parseLogFile(analyticsFile);
    
    const analytics = {
      totalDevices: new Set(),
      deviceActivity: {},
      commandStats: {},
      apiCallStats: {},
      authStats: {},
      fileOperationStats: {}
    };

    logs.forEach(log => {
      const deviceId = log.deviceId;
      if (deviceId && deviceId !== 'unknown') {
        analytics.totalDevices.add(deviceId);
      }

      switch (log.type) {
        case 'device_activity':
          if (deviceId) {
            if (!analytics.deviceActivity[deviceId]) {
              analytics.deviceActivity[deviceId] = {
                totalActivities: 0,
                activities: {},
                lastSeen: log.timestamp
              };
            }
            analytics.deviceActivity[deviceId].totalActivities++;
            analytics.deviceActivity[deviceId].activities[log.activity] = 
              (analytics.deviceActivity[deviceId].activities[log.activity] || 0) + 1;
            analytics.deviceActivity[deviceId].lastSeen = log.timestamp;
          }
          break;

        case 'command_execution':
          const commandType = log.commandType;
          if (!analytics.commandStats[commandType]) {
            analytics.commandStats[commandType] = {
              total: 0,
              successful: 0,
              failed: 0,
              averageExecutionTime: 0,
              totalExecutionTime: 0
            };
          }
          analytics.commandStats[commandType].total++;
          analytics.commandStats[commandType].totalExecutionTime += log.executionTime || 0;
          if (log.success) {
            analytics.commandStats[commandType].successful++;
          } else {
            analytics.commandStats[commandType].failed++;
          }
          break;

        case 'api_call':
          const endpoint = log.endpoint;
          if (!analytics.apiCallStats[endpoint]) {
            analytics.apiCallStats[endpoint] = {
              total: 0,
              successful: 0,
              failed: 0,
              averageResponseTime: 0,
              totalResponseTime: 0
            };
          }
          analytics.apiCallStats[endpoint].total++;
          analytics.apiCallStats[endpoint].totalResponseTime += log.responseTime || 0;
          if (log.success) {
            analytics.apiCallStats[endpoint].successful++;
          } else {
            analytics.apiCallStats[endpoint].failed++;
          }
          break;

        case 'authentication':
          const authType = log.authType;
          if (!analytics.authStats[authType]) {
            analytics.authStats[authType] = {
              total: 0,
              successful: 0,
              failed: 0
            };
          }
          analytics.authStats[authType].total++;
          if (log.success) {
            analytics.authStats[authType].successful++;
          } else {
            analytics.authStats[authType].failed++;
          }
          break;

        case 'file_operation':
          const operation = log.operation;
          if (!analytics.fileOperationStats[operation]) {
            analytics.fileOperationStats[operation] = {
              total: 0,
              successful: 0,
              failed: 0,
              totalSize: 0
            };
          }
          analytics.fileOperationStats[operation].total++;
          analytics.fileOperationStats[operation].totalSize += log.fileSize || 0;
          if (log.success) {
            analytics.fileOperationStats[operation].successful++;
          } else {
            analytics.fileOperationStats[operation].failed++;
          }
          break;
      }
    });

    // Calculate averages
    Object.values(analytics.commandStats).forEach(stat => {
      if (stat.total > 0) {
        stat.averageExecutionTime = Math.round(stat.totalExecutionTime / stat.total);
      }
    });

    Object.values(analytics.apiCallStats).forEach(stat => {
      if (stat.total > 0) {
        stat.averageResponseTime = Math.round(stat.totalResponseTime / stat.total);
      }
    });

    analytics.totalDevices = analytics.totalDevices.size;

    return analytics;
  }

  /**
   * Generate comprehensive daily report
   */
  async generateDailyReport(date) {
    const [requestStats, errorAnalysis, performanceMetrics, deviceAnalytics] = await Promise.all([
      this.getRequestStats(date),
      this.getErrorAnalysis(date),
      this.getPerformanceMetrics(date),
      this.getDeviceAnalytics(date)
    ]);

    return {
      date,
      summary: {
        totalRequests: requestStats.totalRequests,
        successRate: requestStats.totalRequests > 0 ? 
          Math.round((requestStats.successfulRequests / requestStats.totalRequests) * 100) : 0,
        totalErrors: errorAnalysis.totalErrors,
        averageResponseTime: requestStats.averageResponseTime,
        activeDevices: deviceAnalytics.totalDevices
      },
      requestStats,
      errorAnalysis,
      performanceMetrics,
      deviceAnalytics,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Get available log dates
   */
  getAvailableLogDates() {
    const dates = new Set();
    
    const directories = [this.dailyDir, this.errorDir, this.performanceDir, this.analyticsDir];
    
    directories.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const match = file.match(/(\d{4}-\d{2}-\d{2})/);
          if (match) {
            dates.add(match[1]);
          }
        });
      }
    });
    
    return Array.from(dates).sort().reverse();
  }

  /**
   * Clean old log files
   */
  cleanOldLogs(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const directories = [this.dailyDir, this.errorDir, this.performanceDir, this.analyticsDir];
    let deletedFiles = 0;
    
    directories.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const match = file.match(/(\d{4}-\d{2}-\d{2})/);
          if (match) {
            const fileDate = new Date(match[1]);
            if (fileDate < cutoffDate) {
              fs.unlinkSync(path.join(dir, file));
              deletedFiles++;
            }
          }
        });
      }
    });
    
    return deletedFiles;
  }
}

module.exports = LogAnalyzer;
