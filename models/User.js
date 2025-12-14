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

module.exports = (sequelize) => {
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

  // Add syncWithDatabase method for manual index management
  User.syncWithDatabase = async function() {
    const queryInterface = this.sequelize.getQueryInterface();
    const transaction = await this.sequelize.transaction();
    
    // Helper function to check if an index exists
    const indexExists = async (tableName, indexName) => {
      try {
        const [results] = await queryInterface.sequelize.query(
          `SHOW INDEX FROM \`${tableName}\` WHERE Key_name = '${indexName}'`,
          { transaction }
        );
        return results.length > 0;
      } catch (error) {
        console.error(`Error checking index ${indexName}:`, error.message);
        return false;
      }
    };

    // Helper function to safely remove an index
    const safeRemoveIndex = async (tableName, indexName) => {
      try {
        await queryInterface.removeIndex(tableName, indexName, { transaction });
        console.log(`Dropped index: ${indexName}`);
      } catch (error) {
        if (!error.message.includes("Can't DROP")) {
          console.error(`Error dropping index ${indexName}:`, error.message);
        }
      }
    };
    
    try {
      // Check if the table exists
      const [tables] = await queryInterface.sequelize.query(
        "SHOW TABLES LIKE 'users'"
      );
      
      if (tables.length === 0) {
        // Table doesn't exist, create it without indexes first
        await User.sync({ ...options, transaction });
      } else {
        // Table exists, handle existing columns carefully
        const [columns] = await queryInterface.sequelize.query(
          'DESCRIBE users'
        );
        
        const columnNames = columns.map(col => col.Field);
        
        // Add missing columns manually to avoid deadlocks
        const columnsToAdd = [];
        
        if (!columnNames.includes('created_at')) {
          columnsToAdd.push(queryInterface.addColumn('users', 'created_at', {
            type: DataTypes.DATE,
            allowNull: true
          }, { transaction }));
        }
        
        if (!columnNames.includes('updated_at')) {
          columnsToAdd.push(queryInterface.addColumn('users', 'updated_at', {
            type: DataTypes.DATE,
            allowNull: true
          }, { transaction }));
        }
        
        if (columnsToAdd.length > 0) {
          await Promise.all(columnsToAdd);
          
          // Update existing rows to have valid dates
          await queryInterface.sequelize.query(
            "UPDATE users SET created_at = NOW(), updated_at = NOW() WHERE created_at IS NULL OR updated_at IS NULL",
            { transaction }
          );
          
          // Now alter the columns to be NOT NULL
          if (!columnNames.includes('created_at')) {
            try {
              await queryInterface.changeColumn('users', 'created_at', {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
              }, { transaction });
            } catch (error) {
              console.error('Error updating created_at column:', error.message);
              throw error;
            }
          }
        }
      };

      // Helper function to safely remove an index
      const safeRemoveIndex = async (tableName, indexName) => {
        try {
          await queryInterface.removeIndex(tableName, indexName, { transaction });
          console.log(`Dropped index: ${indexName}`);
        } catch (error) {
          if (!error.message.includes("Can't DROP")) {
            console.error(`Error dropping index ${indexName}:`, error.message);
          }
        }
      };

      // Remove any potentially conflicting indexes first
      await safeRemoveIndex('users', 'email');
      await safeRemoveIndex('users', 'username');
      await safeRemoveIndex('users', 'idx_users_email');
      await safeRemoveIndex('users', 'idx_users_username');
      await safeRemoveIndex('users', 'idx_users_role_active');
      
      // Add email index
      if (!(await indexExists('users', 'idx_users_email'))) {
        await queryInterface.addIndex('users', ['email'], {
          name: 'idx_users_email',
          unique: true,
          transaction
        });
        console.log('Created index: idx_users_email');
      }
      
      // Add username index
      if (!(await indexExists('users', 'idx_users_username'))) {
        await queryInterface.addIndex('users', ['username'], {
          name: 'idx_users_username',
          unique: true,
          transaction
        });
        console.log('Created index: idx_users_username');
      }
      
      // Check if is_active column exists before creating the role_active index
      const [columns] = await queryInterface.sequelize.query(
        `SHOW COLUMNS FROM users LIKE 'is_active'`,
        { transaction }
      );
      
      if (columns.length > 0 && !(await indexExists('users', 'idx_users_role_active'))) {
        await queryInterface.addIndex('users', ['role', 'is_active'], {
          name: 'idx_users_role_active',
          transaction
        });
        console.log('Created index: idx_users_role_active');
      }
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      console.error('Error syncing User model:', error);
      return false;
    }
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
