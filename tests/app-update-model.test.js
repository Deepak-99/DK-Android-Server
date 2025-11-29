const { sequelize, syncAndClose } = require('./test-db-config');
const AppUpdate = require('../models/AppUpdate');

// Mock the logger
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  child: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })
}));

describe('AppUpdate Model', () => {
  beforeAll(async () => {
    // Sync all models
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    // Close the database connection
    await sequelize.close();
  });

  it('should create a new app update', async () => {
    const appUpdate = await AppUpdate.create({
      version: '1.0.0',
      version_code: 100,
      channel: 'stable',
      file_path: '/test/path',
      file_name: 'test.apk',
      file_size: 1024,
      checksum: 'test-checksum',
      is_required: true,
      min_sdk_version: 21,
      is_active: true,
      release_notes: 'Test release',
      rollout_percentage: 100
    });

    expect(appUpdate).toBeDefined();
    expect(appUpdate.version).toBe('1.0.0');
    expect(appUpdate.version_code).toBe(100);
    expect(appUpdate.channel).toBe('stable');
    expect(appUpdate.is_required).toBe(true);
  });

  it('should validate version format', async () => {
    await expect(
      AppUpdate.create({
        version: 'invalid-version',
        version_code: 100,
        channel: 'stable',
        file_path: '/test/path',
        file_name: 'test.apk',
        file_size: 1024,
        checksum: 'test-checksum',
        is_required: true,
        min_sdk_version: 21,
        is_active: true
      })
    ).rejects.toThrow();
  });
});
