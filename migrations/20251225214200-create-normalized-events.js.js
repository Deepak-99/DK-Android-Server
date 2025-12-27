module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('normalized_events', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

      device_id: { type: Sequelize.INTEGER, allowNull: false },
      type: { type: Sequelize.STRING(32), allowNull: false },

      source: { type: Sequelize.STRING(16), defaultValue: 'android' },
      app: { type: Sequelize.STRING(128), allowNull: true },
      signal: { type: Sequelize.STRING(64), allowNull: true },

      confidence: { type: Sequelize.FLOAT, defaultValue: 1.0 },
      meta: { type: Sequelize.JSON },

      timestamp: { type: Sequelize.BIGINT, allowNull: false },

      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE
    });

    await queryInterface.addIndex('normalized_events', ['device_id', 'timestamp']);
    await queryInterface.addIndex('normalized_events', ['type']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('normalized_events');
  }
};