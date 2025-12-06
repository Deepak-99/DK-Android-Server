/**
 * routes/index.js
 * Central router – loads all route modules automatically.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const express = require("express");

const router = express.Router();
const rootDir = __dirname;

fs.readdirSync(rootDir)
    .filter((file) => file !== "index.js" && file.endsWith(".js"))
    .forEach((file) => {
        const routeName = path.basename(file, ".js"); // devices.js → devices
        const route = require(path.join(rootDir, file));

        router.use(`/${routeName}`, route);

        console.log(`📌 Route mounted: /${routeName}`);
    });

module.exports = router;
