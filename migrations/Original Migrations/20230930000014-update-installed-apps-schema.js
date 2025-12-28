'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const targetTable = 'installed_apps';
    const sourceTables = ['device_installed_apps', 'device_installed_packages'];
    
    try {
      // Check if the target table already exists
      const [tables] = await queryInterface.sequelize.query(
        `SHOW TABLES LIKE '${targetTable}'`,
        { transaction }
      );
      
      if (tables.length === 0) {
        // Create the new table with the correct schema
        await queryInterface.createTable(targetTable, {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
          },
          device_id: {
            type: Sequelize.STRING(255),
            allowNull: false,
            references: {
              model: 'devices',
              key: 'device_id'  // Updated to reference the correct column in devices table
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: 'Reference to devices table (device_id)'
          },
          package_name: {
            type: Sequelize.STRING(255),
            allowNull: false,
            comment: 'Unique package identifier (e.g., com.example.app)'
          },
          app_name: {
            type: Sequelize.STRING(255),
            allowNull: false,
            comment: 'Display name of the app'
          },
          version_name: {
            type: Sequelize.STRING(100),
            allowNull: true,
            comment: 'Version string (e.g., 1.0.0)'
          },
          version_code: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Internal version number'
          },
          install_time: {
            type: Sequelize.DATE,
            allowNull: true,
            comment: 'When the app was installed'
          },
          update_time: {
            type: Sequelize.DATE,
            allowNull: true,
            comment: 'When the app was last updated'
          },
          app_size: {
            type: Sequelize.BIGINT,
            allowNull: true,
            comment: 'App size in bytes'
          },
          data_size: {
            type: Sequelize.BIGINT,
            allowNull: true,
            comment: 'App data size in bytes'
          },
          cache_size: {
            type: Sequelize.BIGINT,
            allowNull: true,
            comment: 'App cache size in bytes'
          },
          is_system_app: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            comment: 'Whether this is a system app'
          },
          is_enabled: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            comment: 'Whether the app is enabled'
          },
          is_updated_system_app: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            comment: 'Whether this is a system app that has been updated'
          },
          permissions: {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'List of permissions granted to the app'
          },
          requested_permissions: {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'List of all permissions the app has requested'
          },
          activities: {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'List of app activities'
          },
          services: {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'List of app services'
          },
          receivers: {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'List of broadcast receivers'
          },
          icon_data: {
            type: Sequelize.TEXT('long'),
            allowNull: true,
            comment: 'Base64 encoded app icon'
          },
          target_sdk_version: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Target SDK version the app was built for'
          },
          min_sdk_version: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Minimum SDK version required by the app'
          },
          installer_package: {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: 'Package that installed this app (e.g., com.android.vending for Play Store)'
          },
          source_dir: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Full path to the base APK for this application'
          },
          data_dir: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Path to the data directory for this application'
          },
          native_library_dir: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Path to the directory containing native libraries'
          },
          process_name: {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: 'Name of the process this app runs in'
          },
          task_affinity: {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: 'Task affinity for this application'
          },
          launch_intent: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'JSON string of the launch intent'
          },
          sync_timestamp: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            comment: 'When this record was last synced from the device'
          },
          is_deleted: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            comment: 'Soft delete flag'
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
          }
        }, { transaction });
        
        // Add indexes
        await queryInterface.addIndex(targetTable, ['device_id'], {
          name: 'idx_installed_apps_device_id',
          transaction
        });
        
        await queryInterface.addIndex(
          targetTable,
          ['package_name', 'device_id'],
          {
            name: 'idx_installed_apps_package_device',
            unique: true,
            transaction
          }
        );
        
        await queryInterface.addIndex(targetTable, ['app_name'], {
          name: 'idx_installed_apps_app_name',
          transaction
        });
        
        await queryInterface.addIndex(targetTable, ['is_system_app'], {
          name: 'idx_installed_apps_system',
          transaction
        });
        
        await queryInterface.addIndex(targetTable, ['sync_timestamp'], {
          name: 'idx_installed_apps_sync_timestamp',
          transaction
        });
      }
      
      // Migrate data from source tables if they exist
      for (const sourceTable of sourceTables) {
        const [sourceTablesExist] = await queryInterface.sequelize.query(
          `SHOW TABLES LIKE '${sourceTable}'`,
          { transaction }
        );
        
        if (sourceTablesExist.length > 0) {
          // Check if we've already migrated this table
          const [migrationCheck] = await queryInterface.sequelize.query(
            `SELECT 1 FROM information_schema.tables WHERE table_name = '${targetTable}'`,
            { transaction }
          );
          
          if (migrationCheck.length > 0) {
            // Migrate data from source table to target table
            await queryInterface.sequelize.query(
              `INSERT IGNORE INTO ${targetTable} 
               (id, device_id, package_name, app_name, version_name, version_code, 
                install_time, update_time, is_system_app, is_enabled, 
                is_updated_system_app, permissions, requested_permissions, 
                target_sdk_version, min_sdk_version, installer_package, 
                source_dir, data_dir, native_library_dir, process_name, 
                task_affinity, launch_intent, sync_timestamp, created_at, updated_at)
               SELECT 
                 UUID() as id,
                 device_id,
                 package_name,
                 COALESCE(app_name, package_name) as app_name,
                 version_name,
                 version_code,
                 COALESCE(install_time, first_install_time) as install_time,
                 COALESCE(update_time, last_update_time) as update_time,
                 is_system_app,
                 is_enabled,
                 is_updated_system_app,
                 permissions,
                 requested_permissions,
                 target_sdk_version,
                 min_sdk_version,
                 COALESCE(installer_package, installer_package_name) as installer_package,
                 source_dir,
                 data_dir,
                 native_library_dir,
                 process_name,
                 task_affinity,
                 launch_intent,
                 COALESCE(sync_timestamp, last_updated, NOW()) as sync_timestamp,
                 COALESCE(created_at, NOW()) as created_at,
                 COALESCE(updated_at, NOW()) as updated_at
               FROM ${sourceTable}
               WHERE NOT EXISTS (
                 SELECT 1 FROM ${targetTable} 
                 WHERE ${targetTable}.package_name = ${sourceTable}.package_name 
                 AND ${targetTable}.device_id = ${sourceTable}.device_id
               )`,
              { transaction }
            );
            
            console.log(`Migrated data from ${sourceTable} to ${targetTable}`);
          }
        }
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error in installed_apps migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Note: This is a one-way migration that consolidates data
    // Rolling back would require restoring from backup
    console.warn('Rollback not supported for this migration. Data would need to be restored from backup.');
  }
};
