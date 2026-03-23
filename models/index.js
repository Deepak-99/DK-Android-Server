// models/index.js

const fs = require('fs');
const path = require('path');
const { DataTypes } = require('sequelize');

// 🔥 Load existing sequelize instance
const sequelize = require('../config/database');

if (!sequelize) {
  throw new Error('[MODELS] ❌ Sequelize instance not found. Check config/database.js');
}

const db = {};
const basename = path.basename(__filename);

// 🔥 Files to ignore
const IGNORE_FILES = [
  basename,
  'db.js'
];

// 🔥 Only load valid model files
const modelFiles = fs.readdirSync(__dirname).filter((file) => {
  return (
    file.endsWith('.js') &&
    !file.endsWith('.test.js') &&
    !file.includes('.clean') &&   // ❌ ignore temp files
    !IGNORE_FILES.includes(file)
  );
});

console.log(`[MODELS] 🔍 Found ${modelFiles.length} model files`);

modelFiles.forEach((file) => {
  const filePath = path.join(__dirname, file);

  try {
    const modelFactory = require(filePath);

    if (typeof modelFactory !== 'function') {
      console.warn(`[MODELS] ⚠️ Skipping ${file} (not a function export)`);
      return;
    }

    const model = modelFactory(sequelize, DataTypes);

    if (!model || !model.name) {
      throw new Error(`Invalid model export in ${file}`);
    }

    if (db[model.name]) {
      throw new Error(`Duplicate model name detected: ${model.name}`);
    }

    db[model.name] = model;

    console.log(`[MODELS] ✅ Loaded → ${model.name}`);

  } catch (err) {
    console.error(`[MODELS] ❌ Failed to load ${file}`);
    console.error(err);
    process.exit(1); // 🔥 HARD FAIL (production safe)
  }
});

console.log('[MODELS] 🔗 Running associations');

Object.keys(db).forEach((modelName) => {
  if (typeof db[modelName].associate === 'function') {
    try {
      db[modelName].associate(db);
      console.log(`[MODELS] 🔗 Associated → ${modelName}`);
    } catch (err) {
      console.error(`[MODELS] ❌ Association failed for ${modelName}`);
      console.error(err);
      process.exit(1);
    }
  }
});

// 🔥 Attach sequelize
db.sequelize = sequelize;

// Optional: expose Sequelize class if needed
db.Sequelize = require('sequelize');

console.log(`[MODELS] 🚀 ${Object.keys(db).length - 2} models initialized`);

module.exports = db;