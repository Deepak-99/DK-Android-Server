'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_permissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
      resource: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      action: {
        type: Sequelize.ENUM(
          'view',
          'create',
          'update',
          'delete',
          'download',
          'execute'
        ),
        allowNull: false,
      },
      allowed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
      deleted_at: Sequelize.DATE,
    });

    await queryInterface.addIndex('user_permissions', ['user_id'], {
      name: 'idx_user_permissions_user',
    });

    await queryInterface.addConstraint('user_permissions', {
      fields: ['user_id', 'resource', 'action'],
      type: 'unique',
      name: 'idx_user_permissions_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_permissions');
  },
};
