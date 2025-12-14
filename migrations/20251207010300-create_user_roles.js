'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_roles', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      role_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
      deleted_at: Sequelize.DATE,
    });

    await queryInterface.addIndex('user_roles', ['user_id'], {
      name: 'idx_user_roles_user',
    });
    await queryInterface.addIndex('user_roles', ['role_id'], {
      name: 'idx_user_roles_role',
    });

    await queryInterface.addConstraint('user_roles', {
      fields: ['user_id', 'role_id'],
      type: 'unique',
      name: 'uniq_user_role',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_roles');
  },
};
