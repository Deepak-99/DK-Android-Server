const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {

  const User = sequelize.define('User', {

    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false
    },

    role: {
      type: DataTypes.ENUM('admin','user'),
      defaultValue: 'user'
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      field: 'is_active',
      defaultValue: true
    },

    loginAttempts: {
      type: DataTypes.INTEGER,
      field: 'login_attempts',
      defaultValue: 0
    },

    lockedUntil: {
      type: DataTypes.DATE,
      field: 'locked_until'
    }

  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        user.password = await bcrypt.hash(user.password, 12);
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      }
    }
  });

  User.prototype.comparePassword = function(password) {
    return bcrypt.compare(password, this.password);
  };

  User.associate = (models) => {

    User.belongsToMany(models.Role, {
      through: models.UserRole,
      foreignKey: 'userId',
      otherKey: 'roleId',
      as: 'roles'
    });

    User.hasMany(models.UserPermission, {
      foreignKey: 'userId',
      as: 'permissions'
    });
  };

  return User;
};