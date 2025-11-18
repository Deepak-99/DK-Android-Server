const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
// Helper function to calculate success rate
    const calculateSuccessRate = (appUpdate) => {
        if (appUpdate.install_attempts > 0) {
            appUpdate.success_rate = (appUpdate.install_success_count / appUpdate.install_attempts) * 100;
        } else {
            appUpdate.success_rate = 0;
        }
        return appUpdate.success_rate;
    };

    // Validation is now handled inline for each field that needs it
    const AppUpdate = sequelize.define('AppUpdate', {
        // Core update information
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        version: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                notEmpty: {msg: 'Version is required'},
                isSemVer(value) {
                    if (!/^\d+\.\d+\.\d+(-[\w-]+(\.[\w-]+)*)?(\+[\w-]+)?$/.test(value)) {
                        throw new Error('Version must follow semantic versioning (e.g., 1.0.0 or 2.1.3-beta.1)');
                    }
                }
            }
        },
        version_code: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isInt: {msg: 'Version code must be an integer'},
                min: 1
            }
        },
        channel: {
            type: DataTypes.ENUM('stable', 'beta', 'alpha'),
            defaultValue: 'stable',
            allowNull: false
        },

        // File information
        file_path: {
            type: DataTypes.STRING(512),
            allowNull: false,
            validate: {
                notEmpty: {msg: 'File path is required'}
            }
        },
        file_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: {msg: 'File name is required'}
            }
        },
        file_size: {
            type: DataTypes.BIGINT,
            allowNull: false,
            validate: {
                min: 1024, // 1KB minimum
                max: 1024 * 1024 * 1000 // 1GB maximum
            }
        },
        checksum: {
            type: DataTypes.STRING(64),
            allowNull: false,
            validate: {
                is: /^[a-f0-9]{64}$/i
            }
        },

        // Update metadata
        release_notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        whats_new: {
            type: DataTypes.JSON,
            allowNull: true
        },

        // Rollout controls
        is_required: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        is_rollout_paused: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        rollout_percentage: {
            type: DataTypes.INTEGER,
            defaultValue: 100,
            validate: {
                min: 0,
                max: 100
            }
        },
        rollout_start_time: {
            type: DataTypes.DATE,
            allowNull: true
        },

        // Device targeting
        min_sdk_version: {
            type: DataTypes.INTEGER,
            defaultValue: 21,
            validate: {min: 1}
        },
        max_sdk_version: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        device_models: {
            type: DataTypes.JSON,
            defaultValue: [],
            validate: {
                isValid(value) {
                    if (!Array.isArray(value)) {
                        throw new Error('device_models must be an array');
                    }
                    if (value.some(item => typeof item !== 'string' || item.length > 100)) {
                        throw new Error('Each item in device_models must be a string of max 100 characters');
                    }
                }
            },
            get() {
                const rawValue = this.getDataValue('device_models');
                return rawValue || [];
            }
        },
        exclude_device_models: {
            type: DataTypes.JSON,
            defaultValue: [],
            validate: {
                isValid(value) {
                    if (!Array.isArray(value)) {
                        throw new Error('exclude_device_models must be an array');
                    }
                    if (value.some(item => typeof item !== 'string' || item.length > 100)) {
                        throw new Error('Each item in exclude_device_models must be a string of max 100 characters');
                    }
                }
            },
            get() {
                const rawValue = this.getDataValue('exclude_device_models');
                return rawValue || [];
            }
        },
        android_versions: {
            type: DataTypes.JSON,
            defaultValue: [],
            validate: {
                isArrayOfIntegers(value) {
                    if (!Array.isArray(value)) {
                        throw new Error('Android versions must be an array');
                    }
                    if (value.some(item => !Number.isInteger(item))) {
                        throw new Error('Each Android version must be an integer');
                    }
                }
            },
            get() {
                const rawValue = this.getDataValue('android_versions');
                return rawValue || [];
            }
        },
        regions: {
            type: DataTypes.JSON,
            defaultValue: [],
            validate: {
                isValid(value) {
                    if (!Array.isArray(value)) {
                        throw new Error('regions must be an array');
                    }
                    if (value.some(item => typeof item !== 'string' || item.length > 10)) {
                        throw new Error('Each item in regions must be a string of max 10 characters');
                    }
                }
            },
            get() {
                const rawValue = this.getDataValue('regions');
                return rawValue || [];
            }
        },

        // Statistics
        download_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {min: 0}
        },
        install_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {min: 0}
        },
        install_attempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {min: 0}
        },
        install_success_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {min: 0}
        },
        success_rate: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
            validate: {min: 0, max: 100}
        },

        // Metadata
        uploaded_by: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        upload_date: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        is_archived: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        is_deleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        deleted_at: {
            type: DataTypes.DATE
        }
    }, {
        // Explicitly set the table name to match our migration
        tableName: 'app_updates',
        // Model options go here
        timestamps: true,
        underscored: true,
        hooks: {
            beforeCreate: async (appUpdate) => {
                if (appUpdate.version_code && typeof appUpdate.version_code === 'string') {
                    appUpdate.version_code = parseInt(appUpdate.version_code, 10);
                }
                if (appUpdate.rollout_percentage === undefined) {
                    appUpdate.rollout_percentage = 100;
                }
                if (appUpdate.rollout_start_time === undefined) {
                    appUpdate.rollout_start_time = new Date();
                }
            },
            beforeUpdate: (appUpdate) => {
                if (appUpdate.version_code && typeof appUpdate.version_code === 'string') {
                    appUpdate.version_code = parseInt(appUpdate.version_code, 10);
                }
                if (appUpdate.rollout_percentage < 0) {
                    appUpdate.rollout_percentage = 0;
                } else if (appUpdate.rollout_percentage > 100) {
                    appUpdate.rollout_percentage = 100;
                }

                // Update success rate when relevant fields change
                if (appUpdate.changed('install_attempts') || appUpdate.changed('install_success_count')) {
                    calculateSuccessRate(appUpdate);
                }
            },
            beforeBulkCreate: (appUpdates) => {
                appUpdates.forEach(appUpdate => {
                    if (!appUpdate.id) {
                        appUpdate.id = uuidv4();
                    }
                    if (appUpdate.rollout_percentage === undefined) {
                        appUpdate.rollout_percentage = 100;
                    }
                });
            },
            afterCreate: async (appUpdate) => {
                console.log(`New app update created: ${appUpdate.version} (${appUpdate.version_code})`);
            },
            afterUpdate: (appUpdate) => {
                console.log(`App update updated: ${appUpdate.version} (${appUpdate.version_code})`);
            },
            afterDestroy: (appUpdate) => {
                console.log(`App update deleted: ${appUpdate.version} (${appUpdate.version_code}`);
            }
        },
        scopes: {
            active: {
                where: {
                    is_active: true,
                    is_deleted: false
                }
            },
            byChannel: (channel) => ({
                where: {
                    channel,
                    is_active: true,
                    is_deleted: false
                }
            }),
            required: {
                where: {
                    is_required: true,
                    is_active: true,
                    is_deleted: false
                }
            }
        }
    });

// Instance methods
    AppUpdate.prototype.incrementDownloadCount = async function () {
        return this.increment('download_count');
    };

    AppUpdate.prototype.incrementInstallCount = async function (success = true) {
        const updates = {
            install_count: sequelize.literal('install_count + 1'),
            install_attempts: sequelize.literal('install_attempts + 1')
        };

        if (success) {
            updates.install_success_count = sequelize.literal('install_success_count + 1');
        }

        return this.update(updates);
    };

    AppUpdate.prototype.isTargetedForDevice = function (deviceInfo) {
        // Check device model
        if (this.device_models && this.device_models.length > 0 &&
            !this.device_models.includes(deviceInfo.model)) {
            return false;
        }

        // Check excluded device models
        if (this.exclude_device_models && this.exclude_device_models.length > 0 &&
            this.exclude_device_models.includes(deviceInfo.model)) {
            return false;
        }

        // Check Android version
        if (this.android_versions && this.android_versions.length > 0 &&
            !this.android_versions.includes(deviceInfo.androidVersion)) {
            return false;
        }

        // Check region if provided
        if (this.regions && this.regions.length > 0 && deviceInfo.region &&
            !this.regions.includes(deviceInfo.region)) {
            return false;
        }

        return true;
    };

// Class methods
    AppUpdate.getLatestVersion = async function (channel = 'stable') {
        return this.scope([{method: ['byChannel', channel]}])
            .findOne({
                order: [['version_code', 'DESC']]
            });
    };

    AppUpdate.getAvailableUpdate = async function (currentVersionCode, deviceInfo, channel = 'stable') {
        return this.scope([{method: ['byChannel', channel]}])
            .findOne({
                where: {
                    version_code: {[Op.gt]: currentVersionCode},
                    rollout_start_time: {[Op.lte]: new Date()},
                    [Op.or]: [
                        {min_sdk_version: {[Op.lte]: deviceInfo.androidVersion}},
                        {min_sdk_version: null}
                    ]
                },
                order: [['version_code', 'ASC']]
            });
    };

    AppUpdate.getUpdateHistory = async function (limit = 10, offset = 0) {
        return this.scope('active').findAndCountAll({
            order: [['created_at', 'DESC']],
            limit,
            offset
        });
    };

    AppUpdate.getUpdateStats = async function () {
        return this.scope('active').findOne({
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'total_updates'],
                [sequelize.fn('MAX', sequelize.col('version_code')), 'latest_version_code'],
                [sequelize.fn('SUM', sequelize.col('download_count')), 'total_downloads'],
                [sequelize.fn('SUM', sequelize.col('install_count')), 'total_installs']
            ]
        });
    };

// Add syncWithDatabase method for special handling
    AppUpdate.syncWithDatabase = async function (options = {}) {
        const queryInterface = this.sequelize.getQueryInterface();
        const transaction = await this.sequelize.transaction();

        try {
            // Get existing indexes
            let existingIndexes = [];
            try {
                const indexes = await queryInterface.showIndex('app_updates');
                existingIndexes = Array.isArray(indexes) ? indexes : [];
            } catch (error) {
                console.warn('Could not retrieve existing indexes:', error.message);
                existingIndexes = [];
            }

            // Define critical indexes - prioritize the most important ones
            const criticalIndexes = [
                {name: 'idx_app_updates_version_code', columns: ['version_code'], unique: true},
                {name: 'idx_app_updates_channel', columns: ['channel']},
                {name: 'idx_app_updates_created', columns: ['created_at']},
                {name: 'idx_app_updates_is_active', columns: ['is_active']}
            ];

            // Sync the model
            await this.sync({...options, transaction});

            // Drop non-critical indexes
            const nonCriticalIndexes = existingIndexes.filter(idx =>
                idx.Key_name &&
                !criticalIndexes.some(ci => ci.name === idx.Key_name) &&
                idx.Key_name !== 'PRIMARY' &&
                !idx.Key_name.startsWith('PRIMARY')
            );

            for (const index of nonCriticalIndexes) {
                try {
                    await queryInterface.removeIndex('app_updates', index.Key_name, {transaction});
                    console.log(`Dropped non-critical index: ${index.Key_name}`);
                } catch (error) {
                    console.warn(`Failed to drop index ${index.Key_name}:`, error.message);
                }
            }

            // Add or update critical indexes
            for (const index of criticalIndexes) {
                try {
                    const indexExists = existingIndexes.some(idx => idx.Key_name === index.name);

                    if (indexExists) {
                        // Drop existing index first to ensure clean state
                        try {
                            await queryInterface.removeIndex('app_updates', index.name, {transaction});
                            console.log(`Dropped existing index: ${index.name}`);
                        } catch (error) {
                            if (!error.message.includes('ER_CANT_DROP_FIELD_OR_KEY')) {
                                console.warn(`Could not drop index ${index.name}:`, error.message);
                            }
                        }
                    }

                    // Check if the index still exists (it might not have been dropped)
                    const [checkIndex] = await queryInterface.sequelize.query(
                        `SHOW INDEX FROM app_updates WHERE Key_name = '${index.name}'`,
                        { transaction, type: queryInterface.sequelize.QueryTypes.SELECT }
                    );

                    if (!checkIndex || checkIndex.length === 0) {
                        // Only create the index if it doesn't exist
                        await queryInterface.addIndex('app_updates', index.columns, {
                            name: index.name,
                            unique: !!index.unique,
                            transaction
                        });
                        console.log(`Created index ${index.name} on app_updates`);
                    } else {
                        console.log(`Index ${index.name} already exists, skipping creation`);
                    }

                } catch (error) {
                    if (error.original && error.original.code === 'ER_TOO_MANY_KEYS') {
                        console.warn(`Cannot create index ${index.name}: too many keys. Skipping this index.`);
                    } else {
                        console.error(`Error processing index ${index.name}:`, error);
                        throw error; // Re-throw to trigger transaction rollback
                    }
                }
            }

            await transaction.commit();
            return true;

        } catch (error) {
            await transaction.rollback();
            console.error('Error syncing AppUpdate model:', error);
            throw error; // Re-throw to allow caller to handle the error
        }
    };

    // Return the model
    return AppUpdate;
};
