'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {

        await queryInterface.createTable('screenshots', {

            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },

            deviceId: {
                type: 'VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
                allowNull: false,
                references: {
                    model: 'devices',
                    key: 'deviceId'
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE'
            },

            file_path: {
                type: Sequelize.STRING(1024),
                allowNull: false
            },

            file_size: {
                type: Sequelize.BIGINT,
                allowNull: true
            },

            resolution: {
                type: Sequelize.STRING(50),
                allowNull: true
            },

            captured_at: {
                type: Sequelize.DATE,
                allowNull: true
            },

            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },

            updated_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }

        });

        await queryInterface.addIndex('screenshots', ['deviceId'], {
            name: 'idx_screenshots_device'
        });

    },

    async down(queryInterface) {
        await queryInterface.dropTable('screenshots');
    }
};