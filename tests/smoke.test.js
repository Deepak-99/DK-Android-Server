// Simple smoke test to verify test setup
const { sequelize } = require('../config/database.test');

describe('Smoke Test', () => {
  test('Database connection works', async () => {
    await expect(sequelize.authenticate()).resolves.not.toThrow();
  });

  test('1 + 1 equals 2', () => {
    expect(1 + 1).toBe(2);
  });
});
