const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { execSync } = require('child_process');
const { Sequelize } = require('sequelize');

// Enhanced logging function
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  console.log(logMessage);
  return logMessage;
};

// Configuration with validation
const config = {
  database: process.env.DB_NAME || 'hawkshaw_db',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  force: process.env.FORCE_DB_RESET === 'true',
};

// Log configuration (without password for security)
log('Starting database setup with configuration:');
log(`- Database: ${config.database}`);
log(`- Host: ${config.host}:${config.port}`);
log(`- User: ${config.username}`);
log(`- Force reset: ${config.force}`);

// Function to run a command and return the result
const runCommand = (command, options = {}) => {
  try {
    log(`Running command: ${command}`);
    const defaultOptions = {
      stdio: 'inherit',
      ...options
    };
    execSync(command, defaultOptions);
    log(`Command completed successfully: ${command}`);
    return { success: true };
  } catch (error) {
    log(`Command failed: ${command} - ${error.message}`, 'error');
    return { success: false, error };
  }
};

// Main function
const setupDatabase = async () => {
  let db;
  log('Starting database setup process...');

  try {
    // 1. Create a temporary connection to MySQL (without specifying a database)
    log('Creating temporary database connection...');
    const tempSequelize = new Sequelize('', config.username, config.password, {
      host: config.host,
      port: config.port,
      dialect: 'mysql',
      logging: (msg) => log(`[SEQUELIZE] ${msg}`, 'debug'),
      dialectOptions: {
        connectTimeout: 60000
      },
      retry: {
        max: 5,
        timeout: 60000
      }
    });

    // Test the connection
    try {
      await tempSequelize.authenticate();
      log('Successfully connected to MySQL server');
    } catch (error) {
      log(`Failed to connect to MySQL server: ${error.message}`, 'error');
      throw error;
    }

    // 2. Create the database if it doesn't exist
    log(`Creating database '${config.database}' if it doesn't exist...`);
    try {
      await tempSequelize.query(
        `CREATE DATABASE IF NOT EXISTS \`${config.database}\` 
         CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      );
      log(`Database '${config.database}' is ready`);
    } catch (error) {
      log(`Error creating database: ${error.message}`, 'error');
      throw error;
    }

    // 3. Close the temporary connection
    log('Closing temporary database connection...');
    await tempSequelize.close();

    // 4. Connect to the database
    log(`Connecting to database '${config.database}'...`);
    db = new Sequelize(
      config.database,
      config.username,
      config.password,
      {
        host: config.host,
        port: config.port,
        dialect: 'mysql',
        logging: (msg) => log(`[SEQUELIZE] ${msg}`, 'debug'),
        dialectOptions: {
          connectTimeout: 60000
        }
      }
    );

    // Test the database connection
    try {
      await db.authenticate();
      log('Successfully connected to the database');
    } catch (error) {
      log(`Failed to connect to the database: ${error.message}`, 'error');
      throw error;
    }

    // 5. Run migrations in a specific order
    log('Starting migrations...');
    
    // Get a list of all migration files
    const migrationsPath = path.join(__dirname, '../migrations');
    log(`Looking for migration files in: ${migrationsPath}`);
    
    if (!fs.existsSync(migrationsPath)) {
      throw new Error(`Migrations directory not found at: ${migrationsPath}`);
    }

    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.js') && 
             file !== '00000000000000-initial-database-setup.js' && 
             file !== '00000000000001-fix-migration-order.js')
      .sort();
    
    log(`Found ${migrationFiles.length} migration files`);

    // Run migrations in the correct order
    const migrations = [
      '00000000000000-initial-database-setup.js',
      '00000000000001-fix-migration-order.js',
      ...migrationFiles
    ];
    
    log(`Total migrations to run: ${migrations.length}`);

    // Create SequelizeMeta table if it doesn't exist
    log('Ensuring SequelizeMeta table exists...');
    try {
      await db.getQueryInterface().createTable('SequelizeMeta', {
        name: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
          primaryKey: true
        }
      });
      log('SequelizeMeta table is ready');
    } catch (error) {
      log(`Error creating SequelizeMeta table: ${error.message}`, 'error');
      throw error;
    }
    
    // Get already executed migrations
    let executedMigrations = [];
    try {
      [executedMigrations] = await db.query('SELECT * FROM `SequelizeMeta`');
      log(`Found ${executedMigrations.length} previously executed migrations`);
    } catch (error) {
      log(`Error checking executed migrations: ${error.message}`, 'error');
      throw error;
    }

    const executedMigrationNames = new Set(executedMigrations.map(m => m.name));
    let migrationsExecuted = 0;
    
    for (const migrationFile of migrations) {
      if (executedMigrationNames.has(migrationFile)) {
        log(`Skipping already executed migration: ${migrationFile}`);
        continue;
      }
      
      log(`Running migration: ${migrationFile}...`);
      const migrationPath = path.join(__dirname, '../migrations', migrationFile);
      
      if (!fs.existsSync(migrationPath)) {
        throw new Error(`Migration file not found: ${migrationPath}`);
      }

      const migration = require(migrationPath);
      
      try {
        // Run the migration
        log(`Starting migration: ${migrationFile}`);
        await migration.up(db.getQueryInterface(), Sequelize);
        
        // Record the migration
        await db.query('INSERT INTO `SequelizeMeta` (name) VALUES (?)', {
          replacements: [migrationFile]
        });
        
        log(`Migration completed successfully: ${migrationFile}`);
        migrationsExecuted++;
      } catch (error) {
        log(`Error running migration ${migrationFile}: ${error.message}`, 'error');
        log(`Stack trace: ${error.stack}`, 'error');
        throw error;
      }
    }

    log(`Migrations completed. ${migrationsExecuted} new migrations were applied.`);

    // 6. Run seeders
    log('Starting database seeding...');
    const seedResult = runCommand('npx --no-install sequelize-cli db:seed:all', {
      env: {
        ...process.env,
        NODE_ENV: 'development',
        DEBUG: 'sequelize:*'
      },
      cwd: path.join(__dirname, '..'),
      shell: true
    });

    if (!seedResult.success) {
      throw new Error('Seeding failed');
    }

    log('Database setup completed successfully!', 'success');
  } catch (error) {
    log(`Setup failed: ${error.message}`, 'error');
    if (error.stack) {
      log(`Stack trace: ${error.stack}`, 'error');
    }
    process.exit(1);
  } finally {
    // Close the database connection if it was opened
    if (db) {
      try {
        log('Closing database connection...');
        await db.close();
        log('Database connection closed');
      } catch (error) {
        log(`Error closing database connection: ${error.message}`, 'error');
      }
    }
  }
};

// Run the setup with error handling
(async () => {
  try {
    log('Starting database setup...');
    await setupDatabase();
    log('Setup completed successfully!');
    process.exit(0);
  } catch (error) {
    log(`Unhandled error in setup: ${error.message}`, 'error');
    if (error.stack) {
      log(`Stack trace: ${error.stack}`, 'error');
    }
    process.exit(1);
  }
})();