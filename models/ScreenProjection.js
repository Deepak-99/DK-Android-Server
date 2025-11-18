const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ScreenProjection = sequelize.define('ScreenProjection', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
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
        session_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        projection_type: {
            type: DataTypes.ENUM('live_stream', 'remote_control', 'view_only'),
            allowNull: false,
            defaultValue: 'view_only'
        },
        status: {
            type: DataTypes.ENUM('starting', 'active', 'paused', 'stopped', 'error'),
            allowNull: false,
            defaultValue: 'starting'
        },
        resolution: {
            type: DataTypes.STRING, // e.g., "1920x1080"
            allowNull: true
        },
        frame_rate: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 15
        },
        quality: {
            type: DataTypes.ENUM('low', 'medium', 'high'),
            allowNull: false,
            defaultValue: 'medium'
        },
        compression: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 80,
            validate: {
                min: 10,
                max: 100
            }
        },
        viewer_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        max_viewers: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 5
        },
        start_time: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        end_time: {
            type: DataTypes.DATE,
            allowNull: true
        },
        duration: {
            type: DataTypes.INTEGER, // Duration in seconds
            allowNull: true
        },
        bytes_transmitted: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        frames_transmitted: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        connection_info: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'WebRTC/Socket connection details'
        },
        viewer_sessions: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Active viewer session information'
        },
        settings: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Projection settings and preferences'
        },
        error_message: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        last_frame_time: {
            type: DataTypes.DATE,
            allowNull: true
        },
        is_recording: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        recording_path: {
            type: DataTypes.STRING,
            allowNull: true
        },
        access_token: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Token for secure access to projection'
        },
        is_public: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        metadata: {
            type: DataTypes.JSON,
            comment: 'Additional projection metadata'
        }
    }, {
        tableName: 'screen_projections',
        timestamps: true,
        // Disable automatic index creation to avoid 'Too many keys' error
        indexes: [],
        hooks: {
            afterSync: async (options) => {
                const queryInterface = options.sequelize.getQueryInterface();
                const transaction = await options.sequelize.transaction();
                
                try {
                    // Check if the foreign key constraint already exists
                    const [fkResults] = await queryInterface.sequelize.query(
                        `SELECT * FROM information_schema.table_constraints 
                         WHERE constraint_schema = DATABASE() 
                         AND table_name = 'screen_projections' 
                         AND constraint_name = 'screen_projections_deviceId_fk'`,
                        { transaction }
                    );
                    
                    // Only add the constraint if it doesn't exist
                    if (fkResults.length === 0) {
                        // Drop any existing foreign key constraints if they exist
                        await queryInterface.removeConstraint('screen_projections', 'screen_projections_ibfk_1', { transaction }).catch(() => {});
                        
                        // Add the correct foreign key constraint for deviceId
                        await queryInterface.addConstraint('screen_projections', {
                            fields: ['deviceId'],
                            type: 'foreign key',
                            name: 'screen_projections_deviceId_fk',
                            references: { 
                                table: 'devices', 
                                field: 'deviceId'
                            },
                            onDelete: 'CASCADE',
                            onUpdate: 'CASCADE',
                            transaction
                        });
                    }
                    
                    // Check and create indexes only if they don't exist
                    const [sessionIdIndex] = await queryInterface.sequelize.query(
                        `SHOW INDEX FROM screen_projections WHERE Key_name = 'idx_screen_projections_session_id'`,
                        { transaction }
                    );
                    
                    if (sessionIdIndex.length === 0) {
                        await queryInterface.addIndex('screen_projections', ['session_id'], {
                            name: 'idx_screen_projections_session_id',
                            unique: true,
                            transaction
                        });
                    }
                    
                    const [deviceStatusIndex] = await queryInterface.sequelize.query(
                        `SHOW INDEX FROM screen_projections WHERE Key_name = 'idx_screen_projections_device_status'`,
                        { transaction }
                    );
                    
                    if (deviceStatusIndex.length === 0) {
                        await queryInterface.addIndex('screen_projections', ['deviceId', 'status'], {
                            name: 'idx_screen_projections_device_status',
                            transaction
                        });
                    }
                    
                    const [startTimeIndex] = await queryInterface.sequelize.query(
                        `SHOW INDEX FROM screen_projections WHERE Key_name = 'idx_screen_projections_start_time'`,
                        { transaction }
                    );
                    
                    if (startTimeIndex.length === 0) {
                        await queryInterface.addIndex('screen_projections', ['start_time'], {
                            name: 'idx_screen_projections_start_time',
                            transaction
                        });
                    }
                    
                    
                    await transaction.commit();
                } catch (error) {
                    await transaction.rollback();
                    console.error('Error setting up screen_projections foreign keys and indexes:', error);
                    throw error; // Re-throw to prevent silent failures
                }
            }
        }
    });

    // Add instance methods
    ScreenProjection.prototype.addViewer = async function(viewerInfo) {
        this.viewer_count += 1;
        const viewers = this.viewer_sessions || [];
        viewers.push(viewerInfo);
        this.viewer_sessions = viewers;
        await this.save();
        return viewers[viewers.length - 1];
    };

    ScreenProjection.prototype.removeViewer = async function(viewerId) {
        if (this.viewer_count > 0) {
            this.viewer_count -= 1;
        }
        const viewers = this.viewer_sessions || [];
        this.viewer_sessions = viewers.filter(v => v.id !== viewerId);
        await this.save();
    };

    ScreenProjection.prototype.updateStats = async function(frameCount, bytesCount) {
        this.frames_transmitted += frameCount;
        this.bytes_transmitted += bytesCount;
        this.last_frame_time = new Date();
        await this.save();
    };

    // Class methods
    ScreenProjection.getActiveSessions = async function(deviceId = null) {
        const whereClause = deviceId ? { deviceId } : {};
        const activeSessions = await this.findAll({
            where: { 
                ...whereClause,
                status: ['starting', 'active', 'paused']
            },
            order: [['start_time', 'DESC']],
            limit: 50
        });
        return activeSessions;
    };

    ScreenProjection.getSessionStats = async function(deviceId = null) {
        const whereClause = deviceId ? { deviceId } : {};
        
        const [totalProjections, activeProjections] = await Promise.all([
            this.count({ where: whereClause }),
            this.count({ 
                where: { 
                    ...whereClause, 
                    status: ['starting', 'active', 'paused'] 
                } 
            })
        ]);

        const viewerCount = await this.sum('viewer_count', { where: whereClause }) || 0;

        return {
            total: totalProjections,
            active: activeProjections,
            totalViewers: viewerCount
        };
    };

    // Add syncWithDatabase method for special handling
    ScreenProjection.syncWithDatabase = async function(options = {}) {
        const queryInterface = this.sequelize.getQueryInterface();
        const transaction = await this.sequelize.transaction();
        
        try {
            // Check if the table exists
            const [tables] = await queryInterface.sequelize.query(
                "SHOW TABLES LIKE 'screen_projections'"
            );
            
            if (tables.length === 0) {
                // Table doesn't exist, create it without indexes first
                await this.sync({ ...options, transaction });
            } else {
                // Table exists, handle existing columns carefully
                const [columns] = await queryInterface.sequelize.query(
                    'DESCRIBE screen_projections'
                );
                
                const columnNames = columns.map(col => col.Field);
                
                // Add missing columns manually to avoid deadlocks
                if (columnNames.includes('deviceId')) {
                    // Change the column type if it exists
                    await queryInterface.changeColumn('screen_projections', 'deviceId', {
                        type: DataTypes.STRING,
                        allowNull: false
                    }, { transaction });
                }
            }
            
            // Ensure the foreign key constraint is set up correctly
            try {
                await queryInterface.removeConstraint('screen_projections', 'screen_projections_ibfk_1');
            } catch (error) {
                // Ignore error if constraint doesn't exist
            }
            
            try {
                await queryInterface.removeConstraint('screen_projections', 'screen_projections_deviceId_fk');
            } catch (error) {
                // Ignore error if constraint doesn't exist
            }
            
            // Add deviceId foreign key
            await queryInterface.addConstraint('screen_projections', {
                fields: ['deviceId'],
                type: 'foreign key',
                name: 'screen_projections_deviceId_fk',
                references: { 
                    table: 'devices', 
                    field: 'deviceId'
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
                transaction
            });
            
            // Create only the most critical indexes
            // Get existing indexes
            let existingIndexes = [];
            try {
                const indexes = await queryInterface.showIndex('screen_projections', { transaction });
                existingIndexes = Array.isArray(indexes) ? indexes : [];
            } catch (error) {
                console.warn('Could not retrieve existing indexes:', error.message);
                existingIndexes = [];
            }
            const indexNames = existingIndexes.map(idx => idx.Key_name);
            
            // Helper function to safely add an index if it doesn't exist
            const safeAddIndex = async (indexName, fields, options = {}) => {
                if (!indexNames.includes(indexName)) {
                    try {
                        await queryInterface.addIndex('screen_projections', fields, {
                            name: indexName,
                            transaction,
                            ...options
                        });
                        console.log(`Created index ${indexName} on screen_projections`);
                    } catch (error) {
                        if (error.original && error.original.code === 'ER_DUP_KEYNAME') {
                            console.log(`Index ${indexName} already exists, skipping creation`);
                        } else {
                            console.error(`Error creating index ${indexName}:`, error.message);
                            throw error;
                        }
                    }
                } else {
                    console.log(`Index ${indexName} already exists, skipping creation`);
                }
            };
            
            // Add necessary indexes
            await safeAddIndex('idx_screen_projections_session_id', ['session_id'], { unique: true });
            await safeAddIndex('idx_screen_projections_device_status', ['deviceId', 'status']);
            await safeAddIndex('idx_screen_projections_start_time', ['start_time']);
            
            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            console.error('Error syncing ScreenProjection model:', error);
            return false;
        }
    };

    return ScreenProjection;
};
