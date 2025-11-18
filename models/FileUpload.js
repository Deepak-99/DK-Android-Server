const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FileUpload = sequelize.define('FileUpload', {
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
    filename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    original_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    file_path: {
      type: DataTypes.STRING,
      allowNull: false
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    mime_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    file_type: {
      type: DataTypes.ENUM('document', 'image', 'video', 'audio', 'archive', 'other'),
      allowNull: false
    },
    upload_status: {
      type: DataTypes.ENUM('pending', 'uploading', 'completed', 'failed'),
      defaultValue: 'pending'
    },
    upload_progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    checksum: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'File checksum for integrity verification'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional file metadata'
    },
    thumbnail_path: {
      type: DataTypes.STRING,
      allowNull: true
    },
    is_encrypted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    encryption_key: {
      type: DataTypes.STRING,
      allowNull: true
    },
    download_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    last_accessed: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'file_uploads',
    timestamps: true,
    underscored: false,
    indexes: [
      {
        name: 'idx_file_uploads_device_id',
        fields: ['deviceId']
      },
      {
        name: 'idx_file_uploads_upload_status',
        fields: ['upload_status']
      },
      {
        name: 'idx_file_uploads_file_type',
        fields: ['file_type']
      },
      {
        name: 'idx_file_uploads_created_at',
        fields: ['created_at']
      },
      {
        name: 'idx_file_uploads_expires_at',
        fields: ['expires_at']
      }
    ],
    hooks: {
      afterSync: async (options) => {
        const queryInterface = options.sequelize.getQueryInterface();
        const transaction = await options.sequelize.transaction();
        
        try {
          // Check if the constraint already exists
          const [results] = await options.sequelize.query(
            `SELECT * FROM information_schema.table_constraints 
             WHERE constraint_schema = DATABASE() 
             AND table_name = 'file_uploads' 
             AND constraint_name = 'file_uploads_device_id_fk'`,
            { transaction }
          );
          
          // Only add the constraint if it doesn't exist
          if (results.length === 0) {
            // Remove existing constraints if they exist
            await queryInterface.removeConstraint('file_uploads', 'file_uploads_ibfk_1', { transaction }).catch(() => {});
            
            // Add the correct foreign key constraint for device_id
            await queryInterface.addConstraint('file_uploads', {
              fields: ['deviceId'],
              type: 'foreign key',
              name: 'file_uploads_deviceId_fk',
              references: { 
                table: 'devices', 
                field: 'deviceId'
              },
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE',
              transaction
            });
          }
          
          await transaction.commit();
        } catch (error) {
          await transaction.rollback();
          console.error('Error setting up file_uploads foreign keys:', error);
          throw error;
        }
      }
    }
  });

  FileUpload.associate = function(models) {
    FileUpload.belongsTo(models.Device, {
      foreignKey: 'deviceId',
      targetKey: 'deviceId',  // Changed from 'device_id' to 'deviceId' to match the Device model
      as: 'device'
    });
  };

  return FileUpload;
};
