const db = require('../models');

(async () => {
    try {

        console.log("🔥 Resetting tables...");

        await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

        await db.sequelize.sync({ force: true });

        await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

        console.log("✅ DB RESET COMPLETE");

        process.exit(0);

    } catch (err) {
        console.error("❌ RESET FAILED", err);
        process.exit(1);
    }
})();