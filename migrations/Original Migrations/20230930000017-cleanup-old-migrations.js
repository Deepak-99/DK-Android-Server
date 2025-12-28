'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // List of all the new migrations we want to keep, in order
      const newMigrations = [
        '20230929000000-initial-schema',
        '20230930000001-update-devices-schema',
        '20230930000002-update-screen-projections-schema',
        '20230930000003-update-screen-recordings-schema',
        '20230930000004-update-app-updates-schema',
        '20230930000005-update-device-info-schema',
        '20230930000006-update-file-uploads-schema',
        '20230930000007-update-media-files-schema',
        '20230930000008-update-sms-schema',
        '20230930000009-update-call-logs-schema',
        '20230930000010-update-call-recordings-schema',
        '20230930000011-update-contacts-schema',
        '20230930000012-update-device-audio-schema',
        '20230930000013-update-file-explorer-schema',
        '20230930000014-update-installed-apps-schema',
        '20230930000015-update-device-locations-schema',
        '20230930000016-update-accessibility-data-schema',
        '20230930000018-update-app-logs-schema',
        '20230930000019-update-commands-schema',
        '20230930000020-update-pending-commands-schema',
        '20230930000021-update-dynamic-config-schema',
        '20230930000022-update-app-installations-schema',
        '20230930000017-cleanup-old-migrations'  // Keep this last
      ];

      // First, clear the SequelizeMeta table
      await queryInterface.sequelize.query('TRUNCATE TABLE `SequelizeMeta`', { transaction });

      // Insert the migrations we want to keep, ignoring duplicates
      for (const migration of newMigrations) {
        await queryInterface.sequelize.query(
          'INSERT IGNORE INTO `SequelizeMeta` (`name`) VALUES (?)',
          {
            replacements: [migration],
            transaction
          }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // This migration is one-way only
    // We don't want to restore old migrations that were removed
    return Promise.resolve();
  }
};
