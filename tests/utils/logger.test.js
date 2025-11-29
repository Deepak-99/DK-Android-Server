const logger = require('../../utils/logger');
const fs = require('fs');
const path = require('path');

// Mock the console methods
const originalConsole = { ...console };
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

describe('Logger Utility', () => {
  let logFilePath;
  
  beforeAll(() => {
    // Set up test log file path
    logFilePath = path.join(__dirname, '../../logs/test.log');
    
    // Ensure logs directory exists
    const logsDir = path.dirname(logFilePath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Mock console methods
    global.console = mockConsole;
  });
  
  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
    
    // Clear the test log file
    if (fs.existsSync(logFilePath)) {
      fs.writeFileSync(logFilePath, '');
    }
  });
  
  afterAll(() => {
    // Restore original console methods
    global.console = originalConsole;
    
    // Clean up test log file
    if (fs.existsSync(logFilePath)) {
      fs.unlinkSync(logFilePath);
    }
  });
  
  describe('Log Levels', () => {
    it('should log error messages', () => {
      const errorMessage = 'Test error message';
      logger.error(errorMessage);
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(`[ERROR] ${errorMessage}`)
      );
    });
    
    it('should log warning messages', () => {
      const warnMessage = 'Test warning message';
      logger.warn(warnMessage);
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining(`[WARN] ${warnMessage}`)
      );
    });
    
    it('should log info messages', () => {
      const infoMessage = 'Test info message';
      logger.info(infoMessage);
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining(`[INFO] ${infoMessage}`)
      );
    });
    
    it('should log debug messages in development', () => {
      // Save original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const debugMessage = 'Test debug message';
      logger.debug(debugMessage);
      
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining(`[DEBUG] ${debugMessage}`)
      );
      
      // Restore NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
    
    it('should not log debug messages in production', () => {
      // Save original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const debugMessage = 'Test debug message';
      logger.debug(debugMessage);
      
      expect(console.debug).not.toHaveBeenCalled();
      
      // Restore NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
  });
  
  describe('Log Formatting', () => {
    it('should include timestamp in log messages', () => {
      const testMessage = 'Test message with timestamp';
      logger.info(testMessage);
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \[INFO\] /)
      );
    });
    
    it('should handle objects and arrays in log messages', () => {
      const testObject = { key: 'value', number: 123 };
      logger.info('Test object:', testObject);
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Test object:'),
        testObject
      );
    });
    
    it('should handle errors with stack traces', () => {
      const error = new Error('Test error');
      logger.error('Error occurred:', error);
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error occurred:'),
        error
      );
    });
  });
  
  describe('File Logging', () => {
    it('should write logs to a file when configured', () => {
      // Configure logger to write to test log file
      const fileLogger = require('../../utils/logger')({
        logToFile: true,
        logFile: logFilePath
      });
      
      const testMessage = 'Test file logging';
      fileLogger.info(testMessage);
      
      // Check if log file was created and contains the log message
      expect(fs.existsSync(logFilePath)).toBe(true);
      
      const logContent = fs.readFileSync(logFilePath, 'utf8');
      expect(logContent).toContain(testMessage);
    });
    
    it('should handle log file write errors gracefully', () => {
      // Mock fs.appendFile to simulate an error
      const originalAppendFile = fs.appendFile;
      fs.appendFile = jest.fn((path, data, callback) => {
        callback(new Error('Failed to write to log file'));
      });
      
      const fileLogger = require('../../utils/logger')({
        logToFile: true,
        logFile: '/invalid/path/test.log'
      });
      
      // This should not throw an error
      expect(() => {
        fileLogger.info('This should not throw');
      }).not.toThrow();
      
      // Restore original method
      fs.appendFile = originalAppendFile;
    });
  });
});
