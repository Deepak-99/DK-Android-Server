const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ScreenRecording = sequelize.define('ScreenRecording', {
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
            comment: 'Reference to the device that owns this recording'
        },
        recordingId: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'recordingId',
            unique: true,
            comment: 'Unique identifier for the recording session'
        },
        fileName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'fileName',
            comment: 'Name of the recorded file'
        },
        filePath: {
            type: DataTypes.STRING(1024),
            allowNull: false,
            field: 'filePath',
            comment: 'Filesystem path where the recording is stored'
        },
        fileSize: {
            type: DataTypes.BIGINT,
            allowNull: true,
            field: 'fileSize',
            comment: 'Size of the recording file in bytes'
        },
        duration: {
            type: DataTypes.INTEGER, // Duration in seconds
            allowNull: true
        },
        resolution: {
            type: DataTypes.STRING, // e.g., "1920x1080"
            allowNull: true
        },
        frameRate: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'frameRate',
            defaultValue: 30,
            comment: 'Frames per second of the recording'
        },
        bitRate: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'bitRate',
            comment: 'Bit rate of the recording in kbps'
        },
        format: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'mp4'
        },
        quality: {
            type: DataTypes.ENUM('low', 'medium', 'high', 'ultra'),
            allowNull: true,
            defaultValue: 'medium'
        },
        recordingType: {
            type: DataTypes.ENUM('manual', 'scheduled', 'triggered'),
            allowNull: false,
            field: 'recordingType',
            defaultValue: 'manual',
            comment: 'How the recording was initiated'
        },
        status: {
            type: DataTypes.ENUM('recording', 'completed', 'failed', 'processing'),
            allowNull: false,
            defaultValue: 'recording'
        },
        startTime: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'startTime',
            defaultValue: DataTypes.NOW,
            comment: 'When the recording was started'
        },
        endTime: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'endTime',
            comment: 'When the recording was completed or stopped'
        },
        thumbnailPath: {
            type: DataTypes.STRING(1024),
            allowNull: true,
            field: 'thumbnailPath',
            comment: 'Path to the thumbnail image for the recording'
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Additional recording metadata (app in focus, user activity, etc.)'
        },
        encryptionKey: {
            type: DataTypes.STRING(512),
            allowNull: true,
            field: 'encryptionKey',
            comment: 'Encryption key if recording is encrypted'
        },
        isEncrypted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            field: 'isEncrypted',
            defaultValue: false,
            comment: 'Whether the recording is encrypted'
        },
        uploadStatus: {
            field: 'uploadStatus',
            type: DataTypes.ENUM('pending', 'uploading', 'completed', 'failed'),
            allowNull: false,
            defaultValue: 'pending'
        },
        upload_progress: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
            validate: {
                min: 0,
                max: 100
            }
        },
        error_message: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        tags: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Tags for categorizing recordings'
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            field: 'isDeleted',
            defaultValue: false,
            comment: 'Soft delete flag'
        },
        createdBy: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'createdBy',
            comment: 'User or system that initiated the recording'
        },
        viewCount: {
            type: DataTypes.INTEGER,
            field: 'viewCount',
            defaultValue: 0,
            comment: 'Number of times the recording has been viewed'
        },
        deleted_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'screen_recordings',
        underscored: false,
        timestamps: true,
        paranoid: true, // Soft delete
        deletedAt: 'deleted_at',
        // Disable automatic index creation to avoid 'Too many keys' error
        indexes: []
    });

    // Class methods
    ScreenRecording.getRecordingsByDevice = async function(deviceId, limit = 50, offset = 0) {
        return await this.findAll({
            where: { 
                deviceId: deviceId,
                isDeleted: false
            },
            order: [['start_time', 'DESC']],
            limit,
            offset
        });
    };

    ScreenRecording.getActiveRecordings = async function() {
        return await this.findAll({
            where: { 
                status: 'recording',
                isDeleted: false
            },
            order: [['start_time', 'DESC']]
        });
    };

    ScreenRecording.getRecordingStats = async function(deviceId = null) {
        const whereClause = { isDeleted: false };
        if (deviceId) {
            whereClause.deviceId = deviceId;
        }

        const totalRecordings = await this.count({ where: whereClause });
        const activeRecordings = await this.count({ 
            where: { ...whereClause, status: 'recording' } 
        });
        const completedRecordings = await this.count({ 
            where: { ...whereClause, status: 'completed' } 
        });

        return {
            total: totalRecordings,
            active: activeRecordings,
            completed: completedRecordings,
            failed: await this.count({ where: { ...whereClause, status: 'failed' } })
        };
    };

    return ScreenRecording;
};
