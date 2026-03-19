// models/index.js
const fs = require("fs");
const path = require("path");
const { DataTypes, Sequelize } = require("sequelize");

console.log("[MODELS] STEP 1: models/index.js loaded");

module.exports = (sequelize) => {

  console.log("[MODELS] STEP 2: Loading models with sequelize");

  const db = {};
  const basename = path.basename(__filename);

  const files = fs.readdirSync(__dirname);

  console.log("[MODELS] STEP 3: Files detected:", files);

  files
      .filter(file => {
          return (
              file !== basename &&
              file !== 'db.js' &&   // <-- important fix
              file.endsWith('.js') &&
              !file.endsWith('.test.js')
          );
      })
    .forEach(file => {

      console.log(`[MODELS] STEP 4: Loading model → ${file}`);

      const modelPath = path.join(__dirname, file);

      try {

        const model = require(modelPath)(sequelize, DataTypes);

        db[model.name] = model;

        console.log(`[MODELS] STEP 5: Model loaded → ${model.name}`);

      } catch (err) {

        console.error(`[MODELS] ERROR loading ${file}`, err);

      }

    });

  console.log("[MODELS] STEP 6: Running associations");

  Object.keys(db).forEach(modelName => {

    const model = db[modelName];

    if (typeof model.associate === "function") {

      console.log(`[MODELS] Associating ${modelName}`);

      model.associate(db);

    }

  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  console.log(`[MODELS] STEP 7: ${Object.keys(db).length - 2} models ready`);

  return db;

};