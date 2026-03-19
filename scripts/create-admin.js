'use strict';

require('dotenv').config();

const sequelize = require('../config/database');
const loadModels = require('../models');

const db = loadModels(sequelize);
const { User } = db;

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};

  for (let i = 0; i < args.length; i++) {
    const a = args[i];

    if (a === '--email') out.email = args[++i];
    else if (a === '--password') out.password = args[++i];
    else if (a === '--username') out.username = args[++i];
  }

  return out;
}

(async () => {
  try {

    const { email, password, username } = parseArgs();

    if (!email || !password) {
      console.error(
        'Usage: node scripts/create-admin.js --email <email> --password <password> [--username <username>]'
      );
      process.exit(1);
    }

    if (!process.env.JWT_SECRET) {
      console.warn('WARNING: JWT_SECRET is not set in .env. Set it to a strong random string.');
    }

    await sequelize.authenticate();

    console.log("✅ Database connected");

    const exists = await User.findOne({ where: { email } });

    if (exists) {

      if (exists.role !== 'admin') {
        await exists.update({ role: 'admin' });
        console.log(`User ${email} existed; role updated to admin.`);
      } else {
        console.log(`Admin user ${email} already exists.`);
      }

      process.exit(0);
    }

    const admin = await User.create({
      username: username || email.split('@')[0],
      email,
      password,
      role: 'admin'
    });

    console.log('✅ Admin user created:', {
      id: admin.id,
      email: admin.email,
      username: admin.username,
      role: admin.role
    });

    process.exit(0);

  } catch (err) {

    console.error('Failed to create admin user:', err);

    process.exit(1);
  }

})();