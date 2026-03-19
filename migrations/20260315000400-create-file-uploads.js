'use strict';

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable('file_uploads', {

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

            filename: {
                type: Sequelize.STRING(255),
                allowNull: false
            },

            file_path: {
                type: Sequelize.STRING(1024),
                allowNull: false
            },

            file_size: {
                type: Sequelize.BIGINT,
                allowNull: true
            },

            mime_type: {
                type: Sequelize.STRING(100),
                allowNull: true
            },

            upload_status: {
                type: Sequelize.ENUM('pending','uploading','completed','failed'),
                defaultValue: 'pending'
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

        await queryInterface.addIndex('file_uploads', ['deviceId'], {
            name: 'idx_file_uploads_device'
        });

    },

    async down(queryInterface) {
        await queryInterface.dropTable('file_uploads');
    }

};