'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();

        const perms = [
            // Dashboard
            { group: 'dashboard', key: 'dashboard.view', label: 'View dashboard' },

            // Devices
            { group: 'devices', key: 'devices.view', label: 'View devices' },
            { group: 'devices', key: 'devices.manage', label: 'Manage devices' },
            { group: 'devices', key: 'devices.delete', label: 'Delete devices' },

            // Contacts
            { group: 'contacts', key: 'contacts.view', label: 'View contacts' },
            { group: 'contacts', key: 'contacts.edit', label: 'Edit contacts' },
            { group: 'contacts', key: 'contacts.export', label: 'Export contacts' },

            // File explorer
            { group: 'files', key: 'files.view', label: 'View files' },
            { group: 'files', key: 'files.upload', label: 'Upload files' },
            { group: 'files', key: 'files.download', label: 'Download files' },
            { group: 'files', key: 'files.delete', label: 'Delete files' },

            // Location
            { group: 'location', key: 'location.view', label: 'View location' },
            { group: 'location', key: 'location.history', label: 'View location history' },
            { group: 'location', key: 'location.delete', label: 'Delete location data' },

            // Call logs & recordings
            { group: 'calls', key: 'calls.view', label: 'View call logs' },
            { group: 'recordings', key: 'recordings.view', label: 'Listen to recordings' },
            { group: 'recordings', key: 'recordings.download', label: 'Download recordings' },
            { group: 'recordings', key: 'recordings.delete', label: 'Delete recordings' },

            // SMS
            { group: 'sms', key: 'sms.view', label: 'View SMS' },
            { group: 'sms', key: 'sms.send', label: 'Send SMS' },
            { group: 'sms', key: 'sms.delete', label: 'Delete SMS' },

            // Apps
            { group: 'apps', key: 'apps.view', label: 'View installed apps' },
            { group: 'apps', key: 'apps.manage', label: 'Manage apps / updates' },

            // Screen & camera
            { group: 'screen', key: 'screen.capture', label: 'Capture screenshots' },
            { group: 'screen', key: 'screen.record', label: 'Record screen' },
            { group: 'camera', key: 'camera.capture', label: 'Capture photo/video' },

            // Users & RBAC
            { group: 'users', key: 'users.view', label: 'View users' },
            { group: 'users', key: 'users.manage', label: 'Manage users' },
            { group: 'rbac', key: 'rbac.manage', label: 'Manage roles & permissions' },

            // Settings & logs
            { group: 'settings', key: 'settings.view', label: 'View settings' },
            { group: 'settings', key: 'settings.manage', label: 'Manage settings' },
            { group: 'logs', key: 'logs.view', label: 'View logs' },
        ];

        await queryInterface.bulkInsert(
            'permissions',
            perms.map((p) => ({
                ...p,
                created_at: now,
                updated_at: now,
            })),
            {}
        );

        // assign all permissions to admin role
        const [[adminRole]] = await queryInterface.sequelize.query(
            "SELECT id FROM roles WHERE name = 'admin' LIMIT 1"
        );
        const [permissionRows] = await queryInterface.sequelize.query(
            'SELECT id FROM permissions'
        );

        if (adminRole && permissionRows.length) {
            await queryInterface.bulkInsert(
                'role_permissions',
                permissionRows.map((pr) => ({
                    role_id: adminRole.id,
                    permission_id: pr.id,
                    created_at: now,
                    updated_at: now,
                })),
                {}
            );
        }
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete('role_permissions', null, {});
        await queryInterface.bulkDelete('permissions', null, {});
    },
};
