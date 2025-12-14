'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('permissions', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Full permission key, e.g. devices.view',
      },
      label: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      group: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Logical module group, e.g. devices, contacts',
      },
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
      deleted_at: Sequelize.DATE,
    });

    await queryInterface.addIndex('permissions', ['group'], {
      name: 'idx_permissions_group',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('permissions');
  },
};
