const { Sequelize } = require('sequelize');

// In-memory SQLite database for testing
const sequelize = new Sequelize('sqlite::memory:', {
  logging: false, // Disable logging for tests
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
});

// Helper function to sync and close the database
const syncAndClose = async () => {
  try {
    await sequelize.sync({ force: true });
    return { success: true };
  } catch (error) {
    console.error('Database sync error:', error);
    return { success: false, error };
  }
};

module.exports = {
  sequelize,
  syncAndClose,
};
