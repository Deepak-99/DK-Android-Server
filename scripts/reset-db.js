const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function resetDatabase() {
  try {
    // Get database name from config
    const dbName = sequelize.config.database;
    console.log(`Resetting database: ${dbName}`);

    // Drop and recreate the database
    await sequelize.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    console.log('Dropped existing database');
    
    await sequelize.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('Created new database');
    
    await sequelize.query(`USE \`${dbName}\``);
    console.log('Using database:', dbName);

    console.log('\nDatabase reset successful!');
    console.log('\nNext steps:');
    console.log('1. Run: npx sequelize-cli db:migrate');
    console.log('2. Run: node scripts/init-database.js');
    
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

resetDatabase();
