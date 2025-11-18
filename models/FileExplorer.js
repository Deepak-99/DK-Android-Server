const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('FileExplorer', {
      id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
      },
      deviceId: {
          type: DataTypes.STRING,
          allowNull: false,
          field: 'deviceId',
          references: {
              model: 'devices',
              key: 'deviceId',
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE'
          },
          comment: 'Reference to devices table (deviceId)'
      },
      file_path: {
          type: DataTypes.STRING(1024),
          allowNull: false,
          comment: 'Full path to the file or directory'
      },
      file_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: 'Name of the file or directory'
      },
      parent_path: {
          type: DataTypes.STRING(1024),
          allowNull: true,
          comment: 'Parent directory path'
      },
      file_type: {
          type: DataTypes.ENUM('file', 'directory', 'symlink', 'unknown'),
          allowNull: false
      },
      file_size: {
          type: DataTypes.BIGINT,
          allowNull: true,
          comment: 'File size in bytes (null for directories)'
      },
      mime_type: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'MIME type for files'
      },
      last_modified: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Last modification time'
      },
      permissions: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'File permissions (e.g., rwxrwxrwx)'
      },
      owner: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'File owner'
      },
      group: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'File group'
      },
      is_hidden: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: 'Whether the file is hidden'
      },
      is_readable: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
      },
      is_writable: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
      },
      is_executable: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
      },
      thumbnail_path: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Path to thumbnail image'
      },
      metadata: {
          type: DataTypes.JSON,
          allowNull: true,
          comment: 'Additional file metadata'
      },
      scan_timestamp: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
          comment: 'When this file was scanned'
      },
      is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          comment: 'Whether this file entry is active'
      }
  }, {
      tableName: 'file_explorer',
      timestamps: true,
      underscored: false,
      // Removed afterSync hook as we're now handling the foreign key in the migration file
      indexes: [
          {
              name: 'idx_file_explorer_device_id',
              fields: ['deviceId']
          },
          {
              name: 'file_explorer_file_path_device_id',
              fields: [
                  { name: 'file_path', length: 255 },
                  'deviceId'
              ],
              unique: true
          },
          {
              name: 'idx_file_explorer_parent_path',
              fields: [{ name: 'parent_path', length: 255 }]
          },
          {
              name: 'idx_file_explorer_file_type',
              fields: ['file_type']
          },
          {
              name: 'idx_file_explorer_last_modified',
              fields: ['last_modified']
          },
          {
              name: 'idx_file_explorer_scan_timestamp',
              fields: ['scan_timestamp']
          },
          {
              name: 'idx_file_explorer_file_name',
              fields: [{ name: 'file_name', length: 100 }]
          }
      ]
  });

  // Define association with Device model
  FileExplorer.associate = function(models) {
    FileExplorer.belongsTo(models.Device, {
      foreignKey: 'deviceId',
      targetKey: 'deviceId',
      as: 'device',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  };

  // Add sync options to handle foreign key constraints and indexes
  FileExplorer.syncWithDatabase = async (options = {}) => {
    const queryInterface = sequelize.getQueryInterface();
    
    try {
      // Drop existing foreign key constraints if they exist
      await queryInterface.removeConstraint('file_explorer', 'file_explorer_ibfk_1').catch(() => {});
      await queryInterface.removeConstraint('file_explorer', 'file_explorer_ibfk_3').catch(() => {});
      await queryInterface.removeConstraint('file_explorer', 'file_explorer_device_id_fk').catch(() => {});
      
      // Drop existing indexes that might cause issues
      await queryInterface.removeIndex('file_explorer', 'file_explorer_file_path_device_id').catch(() => {});
      
      // Sync the model without applying indexes first
      await FileExplorer.sync({ ...options, indexes: [] });
      
      // Add the correct foreign key constraint
      await queryInterface.addConstraint('file_explorer', {
        fields: ['device_id'],
        type: 'foreign key',
        name: 'file_explorer_device_id_fk',
        references: {
          table: 'devices',
          field: 'device_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      
      // Add indexes manually with proper configurations
      await queryInterface.addIndex('file_explorer', {
        name: 'file_explorer_file_path_device_id',
        fields: [
          { name: 'file_path', length: 255 }, // Limit the length for the index
          'device_id'
        ],
        unique: true
      });
      
      // Add parent_path index with length specification
      await queryInterface.addIndex('file_explorer', {
        name: 'file_explorer_parent_path',
        fields: [
          { name: 'parent_path', length: 255 } // Limit the length for the index
        ]
      });
      
      // Add other indexes with proper configurations
      await queryInterface.addIndex('file_explorer', {
        name: 'file_explorer_file_type',
        fields: ['file_type']
      });
      
      await queryInterface.addIndex('file_explorer', {
        name: 'file_explorer_is_hidden',
        fields: ['is_hidden']
      });
      
      await queryInterface.addIndex('file_explorer', {
        name: 'file_explorer_last_modified',
        fields: ['last_modified']
      });
      
      await queryInterface.addIndex('file_explorer', {
        name: 'file_explorer_created_at',
        fields: ['created_at']
      });
      
      await queryInterface.addIndex('file_explorer', {
        name: 'file_explorer_updated_at',
        fields: ['updated_at']
      });
      
      return true;
    } catch (error) {
      console.error('Error syncing FileExplorer model:', error);
      return false;
    }
  };

  return FileExplorer;
};
