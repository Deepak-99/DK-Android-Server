'use strict';

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable('locations', {

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

            latitude: {
                type: Sequelize.DECIMAL(10,8),
                allowNull: false
            },

            longitude: {
                type: Sequelize.DECIMAL(11,8),
                allowNull: false
            },

            accuracy: {
                type: Sequelize.FLOAT,
                allowNull: true
            },

            altitude: {
                type: Sequelize.FLOAT,
                allowNull: true
            },

            speed: {
                type: Sequelize.FLOAT,
                allowNull: true
            },

            provider: {
                type: Sequelize.STRING(50),
                allowNull: true
            },

            timestamp: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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

        await queryInterface.addIndex('locations', ['deviceId'], {
            name: 'idx_locations_device'
        });

        await queryInterface.addIndex('locations', ['timestamp'], {
            name: 'idx_locations_timestamp'
        });

    },

    async down(queryInterface) {
        await queryInterface.dropTable('locations');
    }

};