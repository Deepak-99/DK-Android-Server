const { Sequelize, DataTypes } = require('sequelize');

// Create an in-memory SQLite database
const sequelize = new Sequelize('sqlite::memory:', {
  logging: false // Disable logging for tests
});

// Define a simplified AppUpdate model for testing
const AppUpdate = sequelize.define('AppUpdate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  version: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isSemVer: function(value) {
        if (!/^\d+\.\d+\.\d+(-[\w-]+(\.[\w-]+)*(\+[\w-]+)?)?$/.test(value)) {
          throw new Error('Version must follow semantic versioning');
        }
      }
    }
  },
  version_code: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  channel: {
    type: DataTypes.STRING(20),
    defaultValue: 'stable',
    validate: {
      isIn: [['stable', 'beta', 'alpha', 'nightly']]
    }
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  file_size: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  checksum: {
    type: DataTypes.STRING(64),
    allowNull: false
  },
  is_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  min_sdk_version: {
    type: DataTypes.INTEGER,
    defaultValue: 21
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  release_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rollout_percentage: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    validate: {
      min: 0,
      max: 100
    }
  },
  supported_devices: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  install_success_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  install_failure_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  download_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'app_updates',
  timestamps: true,
  paranoid: true,
  underscored: true
});

describe('AppUpdate Model', () => {
  beforeAll(async () => {
    // Sync the model with the database
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
