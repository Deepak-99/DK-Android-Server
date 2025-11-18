const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ScreenProjection = sequelize.define('ScreenProjection', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        deviceId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'devices',
                key: 'id',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE'
            },
            field: 'deviceId',
            comment: 'Reference to devices table'
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
                try {
                    // Drop existing foreign key constraints if they exist
                    await queryInterface.removeConstraint('screen_projections', 'screen_projections_ibfk_1').catch(() => {});
                    
                    // Add the correct foreign key constraint for deviceId
                    await queryInterface.addConstraint('screen_projections', {
                        fields: ['deviceId'],
                        type: 'foreign key',
                        name: 'screen_projections_deviceId_fk',
                        references: { 
                            table: 'devices', 
                            field: 'id' 
                        },
                        onDelete: 'CASCADE',
                        onUpdate: 'CASCADE'
                    });
                    
                    // Create only the most critical indexes
                    await queryInterface.addIndex('screen_projections', ['session_id'], {
                        name: 'idx_screen_projections_session_id',
                        unique: true
                    });
                    
                    await queryInterface.addIndex('screen_projections', ['deviceId', 'status'], {
                        name: 'idx_screen_projections_device_status'
                    });
                    
                    await queryInterface.addIndex('screen_projections', ['start_time'], {
                        name: 'idx_screen_projections_start_time'
                    });
                    
                } catch (error) {
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
        const whereClause = deviceId ? { device_id: deviceId } : {};
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
        const whereClause = deviceId ? { device_id: deviceId } : {};
        
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
                        type: DataTypes.INTEGER.UNSIGNED,
                        allowNull: false,
                        references: {
                            model: 'devices',
                            key: 'id'
                        }
                    }, { transaction });
                }
            }
            
            // Ensure the foreign key constraint is set up correctly
            await queryInterface.removeConstraint('screen_projections', 'screen_projections_ibfk_1').catch(() => {});
            
            // Add device_id foreign key
            await queryInterface.addConstraint('screen_projections', {
                fields: ['deviceId'],
                type: 'foreign key',
                name: 'screen_projections_deviceId_fk',
                references: { 
                    table: 'devices', 
                    field: 'id' 
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
                transaction
            });
            
            // Create only the most critical indexes
            const [existingIndexes] = await queryInterface.showIndex('screen_projections');
            const indexNames = existingIndexes.map(idx => idx.name);
            
            // Drop existing indexes if they exist
            if (indexNames.includes('session_id')) {
                await queryInterface.removeIndex('screen_projections', 'session_id', { transaction });
            }
            
            // Add necessary indexes
            await queryInterface.addIndex('screen_projections', ['session_id'], {
                name: 'idx_screen_projections_session_id',
                unique: true,
                transaction
            });
            
            await queryInterface.addIndex('screen_projections', ['deviceId', 'status'], {
                name: 'idx_screen_projections_device_status',
                transaction
            });
            
            await queryInterface.addIndex('screen_projections', ['start_time'], {
                name: 'idx_screen_projections_start_time',
                transaction
            });
            
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
