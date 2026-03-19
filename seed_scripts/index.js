'use strict';

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');
const { logger } = require('./_config');

/**
 * Get all seed files in the seed_scripts directory
 * @returns {Array} - Array of seed file names in order
 */
function getSeedFiles() {
  return fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.js') && file !== '_config.js' && file !== 'index.js')
    .sort(); // Sort to ensure consistent order (01-... comes before 02-...)
}

/**
 * Run all seed files in sequence
 */
async function seedAll() {
  const seedFiles = getSeedFiles();
  const transaction = await sequelize.transaction();
  
  try {
    logger.info(`[seed] Starting to execute ${seedFiles.length} seed files...`);
    
    for (const file of seedFiles) {
      const filePath = path.join(__dirname, file);
      const seedModule = require(filePath);
      
      if (typeof seedModule.seed === 'function') {
        logger.info(`[seed] Running seed file: ${file}`);
        const result = await seedModule.seed({ transaction });
        
        if (!result || !result.success) {
          throw new Error(`Seed file ${file} failed: ${result?.error || 'Unknown error'}`);
        }
        
        logger.info(`[seed] Completed seed file: ${file}`);
      } else {
        logger.warn(`[seed] Skipping ${file}: No 'seed' function exported`);
      }
    }
    
    // If we get here, all seeds completed successfully
    await transaction.commit();
    logger.info('[seed] All seed files completed successfully');
    return { success: true };
  } catch (error) {
    // Something went wrong, rollback the transaction
    await transaction.rollback();
    logger.error('[seed] Error in seed process:', error);
    return { 
      success: false, 
      error: error.message,
      stack: error.stack 
    };
  }
}

// If this file is run directly, execute the seed
if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      logger.info('Connected to the database');
      
      const result = await seedAll();
      
      if (result.success) {
        logger.info('Database seeding completed successfully');
        process.exit(0);
      } else {
        logger.error('Database seeding failed');
        process.exit(1);
      }
    } catch (error) {
      logger.error('Error during database seeding:', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  seedAll,
  getSeedFiles
};
