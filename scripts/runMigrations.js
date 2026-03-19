require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Helper function to check if a table exists
async function tableExists(queryInterface, tableName) {
  const [tables] = await queryInterface.sequelize.query(
    `SHOW TABLES LIKE '${tableName}'`
  );
  return tables.length > 0;
}

// Helper function to check if an index exists
async function indexExists(queryInterface, tableName, indexName) {
  try {
    const [indexes] = await queryInterface.sequelize.query(
      `SHOW INDEX FROM \`${tableName}\` WHERE Key_name = '${indexName}'`
    );
    return indexes.length > 0;
  } catch (error) {
    // If the table doesn't exist, the index can't exist
    if (error.original && error.original.code === 'ER_NO_SUCH_TABLE') {
      return false;
    }
    throw error;
  }
}

async function runMigrations() {
  let sequelize;
  
  const dbConfig = {
    database: process.env.DB_NAME || 'hawkshaw',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true
    },
    // Add retry logic for connection
    retry: {
      max: 5, // Maximum retry: 5 times
      timeout: 60000, // Set a timeout of 60 seconds
      backoffBase: 1000, // Initial backoff duration in ms. Default: 100ms,
      backoffExponent: 1.5, // Exponent to increase backoff each try. Default: 1.1
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ]
    }
  };
  
  try {
    // Create a connection to the database
    sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        ...dbConfig,
        // Disable foreign key checks during migrations
        dialectOptions: {
          ...(dbConfig.dialectOptions || {}),
          // Disable foreign key checks during migrations
          // This helps with circular dependencies between tables
          // and makes the migration process more resilient
          foreignKeys: 'OFF'
        },
        // Set a longer timeout for migrations
        pool: {
          ...(dbConfig.pool || {}),
          acquire: 30000,
          idle: 10000
        }
      }
    );

    // Test the connection
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Get the query interface
    const queryInterface = sequelize.getQueryInterface();

    // Create SequelizeMeta table if it doesn't exist
    const metaTableExists = await tableExists(queryInterface, 'SequelizeMeta');
    if (!metaTableExists) {
      console.log('Creating SequelizeMeta table...');
      await queryInterface.createTable('SequelizeMeta', {
        name: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
          primaryKey: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      });
    }

    // Get all migration files
    const migrationsPath = path.join(__dirname, '..', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.js') && file !== '20230917000099-cleanup-and-reset.js')
      .sort();

    // Add the cleanup migration last
    migrationFiles.push('20230917000099-cleanup-and-reset.js');

    // Run each migration
    for (const file of migrationFiles) {
      const migrationName = file.replace('.js', '');
      
      // Check if this migration has already been run
      const [existing] = await sequelize.query(
        'SELECT * FROM `SequelizeMeta` WHERE `name` = ?',
        {
          replacements: [migrationName],
          type: sequelize.QueryTypes.SELECT
        }
      );

      if (existing) {
        console.log(`Migration ${file} already applied, skipping...`);
        continue;
      }

      console.log(`Running migration: ${file}`);
      const migration = require(path.join(migrationsPath, file));
      
      // Run the migration in a transaction
      const transaction = await sequelize.transaction();
      
      try {
        await migration.up({
          ...queryInterface,
          // Add index with existence check
          addIndex: async (tableName, attributes, options, model) => {
            const indexName = options.name || `${tableName}_${attributes.join('_')}`;
            try {
              // Try to get the index info
              const [indexes] = await queryInterface.sequelize.query(
                `SHOW INDEX FROM \`${tableName}\` WHERE Key_name = '${indexName}'`
              );
              
              if (indexes.length === 0) {
                console.log(`Creating index ${indexName} on ${tableName}...`);
                return queryInterface.addIndex(tableName, attributes, options, model);
              } else {
                console.log(`Index ${indexName} already exists on ${tableName}, skipping...`);
                return Promise.resolve();
              }
            } catch (error) {
              // If the table doesn't exist, rethrow the error
              if (error.original && error.original.code === 'ER_NO_SUCH_TABLE') {
                throw error;
              }
              // For other errors, log and continue
              console.warn(`Error checking index ${indexName} on ${tableName}:`, error.message);
              return Promise.resolve();
            }
          },
          // Pass through createTable directly to avoid circular dependency
          createTable: (tableName, attributes, options) => {
            console.log(`Creating table ${tableName}...`);
            return queryInterface.createTable(tableName, attributes, options);
          },
          // Pass through other queryInterface methods
          sequelize: queryInterface.sequelize,
          QueryTypes: Sequelize.QueryTypes,
          // Add a safeDropTable function
          safeDropTable: async (tableName, options = {}) => {
            const [tables] = await queryInterface.sequelize.query(
              `SHOW TABLES LIKE '${tableName}'`
            );
            
            if (tables.length > 0) {
              console.log(`Dropping table ${tableName}...`);
              return queryInterface.dropTable(tableName, options);
            }
            return Promise.resolve();
          }
        }, Sequelize, { transaction });
        
        // Record the migration
        await sequelize.query(
          'INSERT INTO `SequelizeMeta` (`name`) VALUES (?)',
          {
            replacements: [migrationName],
            type: sequelize.QueryTypes.INSERT,
            transaction
          }
        );
        
        await transaction.commit();
        console.log(`Migration ${file} completed successfully`);
      } catch (error) {
        await transaction.rollback();
        console.error(`Error running migration ${file}:`, error);
        throw error;
      }
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// Run the migrations
runMigrations();
