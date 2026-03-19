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
        return await this.findAll({
            where: {
                ...whereClause,
                status: ['starting', 'active', 'paused']
            },
            order: [['start_time', 'DESC']],
            limit: 50
        });
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

    return ScreenProjection;
};
