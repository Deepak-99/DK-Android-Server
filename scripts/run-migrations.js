const { sequelize } = require('../config/database');
const { Sequelize } = require('sequelize');
const { Umzug } = require('umzug');
const path = require('path');

async function runMigrations() {
  try {
    console.log('Starting migrations...');
    
    const umzug = new Umzug({
      migrations: {
        glob: path.join(__dirname, '../migrations/*.js'),
        resolve: ({ name, path: filePath, context: sequelize }) => {
          const migration = require(filePath);
          return {
            name,
            up: async () => migration.up(sequelize.getQueryInterface(), Sequelize),
            down: async () => migration.down(sequelize.getQueryInterface(), Sequelize)
          };
        }
      },
      context: sequelize,
      storage: {
        async executed() {
          // This is a workaround for the storage implementation
          const [results] = await sequelize.query('SELECT name FROM SequelizeMeta');
          return results.map(r => r.name);
        },
        async logMigration({ name }) {
          await sequelize.query('INSERT INTO SequelizeMeta (name) VALUES (?)', { replacements: [name] });
        },
        async unlogMigration({ name }) {
          await sequelize.query('DELETE FROM SequelizeMeta WHERE name = ?', { replacements: [name] });
        }
      },
      logger: console
    });

    // Check if SequelizeMeta table exists, if not create it
    try {
      await sequelize.query('SELECT 1 FROM SequelizeMeta LIMIT 1');
    } catch (error) {
      console.log('Creating SequelizeMeta table...');
      await sequelize.query('CREATE TABLE IF NOT EXISTS SequelizeMeta (name VARCHAR(255) NOT NULL, PRIMARY KEY (name))');
    }

    // Run migrations
    console.log('Running migrations...');
    const migrations = await umzug.up();
    
    console.log('\nMigrations completed successfully!');
    if (migrations.length === 0) {
      console.log('No pending migrations found.');
    } else {
      console.log('Successfully ran the following migrations:');
      migrations.forEach(m => console.log(`  - ${m.name}`));
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\nError running migrations:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigrations();
