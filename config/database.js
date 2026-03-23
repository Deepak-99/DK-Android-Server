const { Sequelize } = require("sequelize");

const logger = console;

logger.log("[DB] STEP 1: database.js loaded");

const env = process.env.NODE_ENV || "development";
const isTestEnvironment = env === "test";

logger.log(`[DB] STEP 2: Environment → ${env}`);

const dbConfig = {
  username: process.env.DB_USER || "hawkshaw_user",
  password: process.env.DB_PASSWORD || "8095@DKpassword",
  database:
    process.env.DB_NAME ||
    (isTestEnvironment ? "hawkshaw_db_test" : "hawkshaw_db"),
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  dialect: "mysql",

    define: {
        underscored: true,
        timestamps: true,
        freezeTableName: true
    },

  /* -------------------------------------------------
     ENABLE SQL DEBUG LOGGING
  -------------------------------------------------- */

  logging: (sql, timing) => {
    if (timing !== undefined) {
      logger.log(`[SQL ${timing} ms] ${sql}`);
    } else {
      logger.log(`[SQL] ${sql}`);
    }
  },

  benchmark: true,

  /* -------------------------------------------------
     CONNECTION POOL (IMPORTANT FOR MANY MODELS)
  -------------------------------------------------- */

  pool: {
    max: 20,
    min: 0,
    acquire: 60000,
    idle: 10000
  }
};

logger.log("[DB] STEP 3: DB Config prepared");

async function ensureDatabaseExists() {

  logger.log("[DB] STEP 4: ensureDatabaseExists() starting");

  const tempSequelize = new Sequelize(
    "",
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: false
    }
  );

  try {

    logger.log("[DB] STEP 5: Creating database if not exists");

    await tempSequelize.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`
    );

    logger.log(`[DB] STEP 6: Database ready → ${dbConfig.database}`);

  } catch (err) {

    logger.error("[DB] ERROR creating database", err);

    throw err;

  } finally {

    await tempSequelize.close();

    logger.log("[DB] STEP 7: Temp connection closed");

  }

}

logger.log("[DB] STEP 8: Creating Sequelize instance");

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

logger.log("[DB] STEP 9: Sequelize instance created");

async function testConnection() {

  try {

    logger.log("[DB] STEP 10: Running ensureDatabaseExists()");

    await ensureDatabaseExists();

    logger.log("[DB] STEP 11: Authenticating connection");

    await sequelize.authenticate();

    logger.log("[DB] STEP 12: Database connected successfully");

  } catch (error) {

    logger.error("[DB] STEP 13: Database connection failed", error);

    throw error;

  }

}

module.exports = sequelize;
module.exports.testConnection = testConnection;

logger.log("[DB] STEP 14: database.js export completed");