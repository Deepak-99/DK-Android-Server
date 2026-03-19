'use strict';

const { sequelize, User } = require('../config/database');
const { 
  safeModelOperation, 
  randomString,
  randomBool,
  randomDate,
  sampleData,
  logger,
  randInt
} = require('./_config');

/**
 * Seed test users
 * @param {number} count - Number of test users to create
 * @param {Object} [transaction=null] - Sequelize transaction
 * @returns {Promise<Array>} - Array of created users
 */
async function seedTestUsers(count = 5, transaction = null) {
  const options = transaction ? { transaction } : {};
  const users = [];
  
  for (let i = 0; i < count; i++) {
    const name = sampleData.generateName();
    const email = sampleData.generateEmail(name);
    // Generate a valid username by:
    // 1. Taking the part before @
    // 2. Replacing any non-alphanumeric characters with underscores
    // 3. Trimming to 45 characters (leaving room for the random number)
    // 4. Appending a random number
    const cleanUsername = email.split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 45);
    const username = `${cleanUsername}${randInt(1, 999)}`;
    
    const result = await safeModelOperation(
      async () => {
        const user = await User.create({
          username,
          email,
          password: 'Password1234!', // Must meet: 8+ chars, 1+ number, 1+ uppercase, 1+ lowercase, 1+ special char
          firstName: name.split(' ')[0],
          lastName: name.split(' ')[1] || '',
          role: 'user',
          isActive: randomBool(),
          emailVerified: randomBool(),
          lastLogin: randomDate(new Date(2023, 0, 1), new Date())
        }, options);
        
        logger.info(`[seed] Created test user: ${email}`);
        return user;
      },
      'User',
      `Error creating test user ${i + 1}`
    );
    
    if (result.success) {
      users.push(result.result);
    }
  }
  
  return users;
}

/**
 * Main seed function for users
 * @param {Object} [options={}] - Options for seeding
 * @param {number} [options.testUsersCount=5] - Number of test users to create
 * @param {Object} [transaction=null] - Sequelize transaction
 * @returns {Promise<Object>} - Result of the operation
 */
async function seedUsers(options = {}, transaction = null) {
  const { testUsersCount = 5 } = options;
  
  try {
    logger.info('[seed] Starting users seeding...');
    
    // Create test users
    const testUsers = await seedTestUsers(testUsersCount, transaction);
    
    logger.info(`[seed] Successfully seeded ${testUsers.length} test users`);
    
    return {
      success: true,
      testUsers,
      totalUsers: testUsers.length
    };
  } catch (error) {
    logger.error('[seed] Error in users seeding:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export the seed function
module.exports = {
  seed: seedUsers,
  seedTestUsers,
  seedUsers
};

// If this file is run directly, execute the seed
if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      logger.info('Database connection has been established successfully.');
      
      const result = await seedUsers({
        testUsersCount: 5
      });
      
      logger.info(`Successfully seeded ${result.count} users.`);
      process.exit(0);
    } catch (error) {
      logger.error('Error seeding users:', error);
      process.exit(1);
    }
  })();
}
