// Mock logger for testing
const logger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  child: () => logger
};

module.exports = logger;
