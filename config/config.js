require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'hawkshaw_user',
    password: process.env.DB_PASSWORD || '8095@DKpassword',
    database: process.env.DB_NAME || 'hawkshaw_db',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hawkshaw_db_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'test' ? false : console.log,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '5'),
      min: parseInt(process.env.DB_POOL_MIN || '0'),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'),
      idle: parseInt(process.env.DB_POOL_IDLE || '10000')
    },
    dialectOptions: {
      supportBigNumbers: true,
      bigNumberStrings: true,
      decimalNumbers: true,
      // Handle special characters in password
      charset: 'utf8mb4',
      // Disable foreign key checks during tests
      init: {
        query: 'SET FOREIGN_KEY_CHECKS=0;'
      }
    },
    // Disable foreign key checks during sync
    sync: {
      force: true
    }
  }
};