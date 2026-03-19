// Test configuration
const path = require('path');

module.exports = {
  // Environment
  env: 'test',
  port: process.env.TEST_PORT || 3001,
  
  // Test database configuration - using the same as development
  db: {
    dialect: process.env.DB_DIALECT || 'mysql', // Use MySQL for testing
    database: process.env.DB_NAME || 'hawkshaw_db',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    logging: false, // Disable logging during tests
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    // Disable foreign key checks during tests to avoid constraint issues
    dialectOptions: {
      supportBigNumbers: true,
      bigNumberStrings: true,
      decimalNumbers: true,
      // This is needed to handle foreign key constraints in tests
      // It's a workaround and should be used carefully
      init: {
        query: 'SET FOREIGN_KEY_CHECKS=0;'
      }
    },
    // Disable foreign key checks during sync
    sync: {
      force: true
    }
  },
  
  // JWT configuration for testing
  jwt: {
    secret: 'test-secret-key',
    expiresIn: '1h',
    refreshExpiresIn: '7d',
    issuer: 'dk-hawkshaw-test',
    audience: 'dk-hawkshaw-clients'
  },
  
  // File upload configuration for testing
  uploads: {
    dir: path.join(__dirname, 'test-uploads'),
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'application/vnd.android.package-archive',
      'image/*',
      'application/pdf',
      'text/plain'
    ]
  },
  
  // Test user credentials
  testUser: {
    id: 1,
    email: 'test@example.com',
    password: 'password123',
    role: 'admin',
    isActive: true
  },
  
  // Test admin credentials
  testAdmin: {
    id: 2,
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    isActive: true
  },
  
  // Test device info
  testDevice: {
    id: 'test-device-123',
    model: 'Pixel 6',
    androidVersion: 13,
  },
};
