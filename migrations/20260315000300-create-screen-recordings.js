'use strict';

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable('screen_recordings', {

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

            recording_id: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true
            },

            file_path: {
                type: Sequelize.STRING(1024),
                allowNull: false
            },

            duration: {
                type: Sequelize.INTEGER,
                allowNull: true
            },

            resolution: {
                type: Sequelize.STRING(50),
                allowNull: true
            },

            format: {
                type: Sequelize.STRING(20),
                defaultValue: 'mp4'
            },

            status: {
                type: Sequelize.ENUM('recording','completed','failed','processing'),
                defaultValue: 'recording'
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

        await queryInterface.addIndex('screen_recordings', ['deviceId'], {
            name: 'idx_screen_recordings_device'
        });

    },

    async down(queryInterface) {
        await queryInterface.dropTable('screen_recordings');
    }

};