const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// Password strength requirements
const PASSWORD_STRENGTH = {
  minLength: 8,
  minNumbers: 1,
  minUppercase: 1,
  minLowercase: 1,
  minSymbols: 1,
  allowedSymbols: '!@#$%^&*()_+~`|}{\\[\\]\\:;\\?><,./-='
};

// Validate password strength
const validatePassword = (password) => {
  if (password.length < PASSWORD_STRENGTH.minLength) {
    throw new Error(`Password must be at least ${PASSWORD_STRENGTH.minLength} characters long`);
  }
  
  const numberCount = (password.match(/[0-9]/g) || []).length;
  const upperCount = (password.match(/[A-Z]/g) || []).length;
  const lowerCount = (password.match(/[a-z]/g) || []).length;
  const symbolCount = (password.match(new RegExp(`[${PASSWORD_STRENGTH.allowedSymbols}]`, 'g')) || []).length;
  
  if (numberCount < PASSWORD_STRENGTH.minNumbers) {
    throw new Error(`Password must contain at least ${PASSWORD_STRENGTH.minNumbers} number(s)`);
  }
  if (upperCount < PASSWORD_STRENGTH.minUppercase) {
    throw new Error(`Password must contain at least ${PASSWORD_STRENGTH.minUppercase} uppercase letter(s)`);
  }
  if (lowerCount < PASSWORD_STRENGTH.minLowercase) {
    throw new Error(`Password must contain at least ${PASSWORD_STRENGTH.minLowercase} lowercase letter(s)`);
  }
  if (symbolCount < PASSWORD_STRENGTH.minSymbols) {
    throw new Error(`Password must contain at least ${PASSWORD_STRENGTH.minSymbols} special character(s)`);
  }
};

// Normalize email
const normalizeEmail = (email) => {
  if (!email) return email;
  return email.trim().toLowerCase();
};

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
      unique: true,
      validate: {
        len: [3, 50],
        is: /^[a-zA-Z0-9_]+$/ // Only alphanumeric and underscore
      },
      set(value) {
        this.setDataValue('username', value ? value.trim() : value);
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'Please provide a valid email address'
        },
        notEmpty: {
          msg: 'Email cannot be empty'
        },
        isLowercase: true
      },
      set(value) {
        this.setDataValue('email', normalizeEmail(value));
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Password cannot be empty'
        },
        isStrongEnough(value) {
          validatePassword(value);
        }
      },
      set(value) {
        // Only hash if the password is being set or changed
        if (value) {
          this.setDataValue('password', value);
        }
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'user'),
      defaultValue: 'user',
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'users',
    // Enable and configure timestamp fields
    timestamps: true,
    // Map the timestamp fields to snake_case
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    // Disable automatic index creation to avoid 'Too many keys' error
    indexes: [],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      }
    }
  });

  User.prototype.comparePassword = async function(candidatePassword) {
    if (!candidatePassword || !this.password) {
      return false;
    }
    return bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.isLocked = function() {
    return !!(this.locked_until && this.locked_until > Date.now());
  };

  User.prototype.incrementLoginAttempts = async function() {
    // If lock has expired, reset the counter
    if (this.locked_until && this.locked_until < new Date()) {
      return this.update({
        login_attempts: 1,
        locked_until: null
      });
    }

    const updates = { login_attempts: this.login_attempts + 1 };
    
    if (this.login_attempts + 1 >= 5 && !this.isLocked()) {
      updates.locked_until = new Date(Date.now() + 2 * 60 * 60 * 1000); // Lock for 2 hours
    }

    return this.update(updates);
  };

  User.prototype.resetLoginAttempts = async function() {
    return this.update({
      login_attempts: 0,
      locked_until: null
    });
  };

    // Associations
    User.associate = (models) => {
        if (models.Role && models.UserRole) {
            User.belongsToMany(models.Role, {
                through: models.UserRole,
                foreignKey: 'user_id',
                otherKey: 'role_id',
                as: 'roles',
            });
        }

        if (models.UserPermission) {
            User.hasMany(models.UserPermission, {
                foreignKey: 'userId',
                as: 'permissions',
            });
        }
    };


    return User;
};
