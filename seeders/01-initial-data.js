'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if admin user already exists
    const [users] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'admin@example.com'"
    );

    if (users.length === 0) {
      // Create admin user
      await queryInterface.bulkInsert('users', [{
        id: '00000000-0000-0000-0000-000000000000',
        username: 'admin',
        email: 'admin@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
        role: 'admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }]);
      console.log('Created admin user');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the admin user
    await queryInterface.bulkDelete('users', { email: 'admin@example.com' });
  }
};
