// controllers/api/v1/commandController.js
const { Command, Device, User } = require('../../../models');
const { Op, QueryTypes, literal } = require('sequelize');
const logger = require('../../../utils/logger');
const { v4: uuidv4 } = require('uuid');
const { publishToQueue } = require('../../../services/messageQueue');
const { COMMAND_PRIORITIES, COMMAND_STATUSES } = require('../../../constants/commands');

/**
 * Queue a new command for a device
 */
exports.queueCommand = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const {
            command,
            params = {},
            priority = 'normal',
            executeAt,
            ttl,
            requiresAck = false,
            metadata = {}
        } = req.body;

        // Validate priority
        if (!Object.values(COMMAND_PRIORITIES).includes(priority)) {
            return res.status(400).json({
                success: false,
                error: `Invalid priority. Must be one of: ${Object.values(COMMAND_PRIORITIES).join(', ')}`
            });
        }

        // Validate device exists
        const device = await Device.findByPk(deviceId);
        if (!device) {
            return res.status(404).json({
                success: false,
                error: 'Device not found'
            });
        }

        // Create command record
        const commandId = uuidv4();
        const commandRecord = await Command.create({
            id: commandId,
            deviceId,
            command,
            params,
            priority,
            status: COMMAND_STATUSES.PENDING,
            requiresAck,
            executeAt: executeAt ? new Date(executeAt) : new Date(),
            ttl: ttl || 24 * 60 * 60, // Default TTL: 24 hours
            metadata: {
                queuedBy: req.user?.id || 'system',
                ...metadata
            }
        });

        // Publish to message queue if immediate execution
        if (!executeAt || new Date(executeAt) <= new Date()) {
            await publishToQueue('command_queue', {
                commandId,
                deviceId,
                command,
                params,
                priority,
                requiresAck
            });
        }

        logger.info(`Command ${commandId} queued for device ${deviceId}: ${command}`);

        return res.status(202).json({
            success: true,
            data: {
                commandId,
                status: COMMAND_STATUSES.PENDING
            }
        });

    } catch (error) {
        logger.error('Error queuing command:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to queue command',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get command status
 */
exports.getCommandStatus = async (req, res) => {
    try {
        const { commandId } = req.params;

        const command = await Command.findByPk(commandId, {
            include: [{
                model: Device,
                attributes: ['id', 'deviceName', 'model']
            }]
        });

        if (!command) {
            return res.status(404).json({
                success: false,
                error: 'Command not found'
            });
        }

        return res.json({
            success: true,
            data: command
        });

    } catch (error) {
        logger.error('Error getting command status:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get command status'
        });
    }
};

/**
 * List commands with filters
 */
exports.listCommands = async (req, res) => {
    try {
        const {
            deviceId,
            status,
            command,
            priority,
            startDate,
            endDate,
            page = 1,
            limit = 50,
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        } = req.query;

        // Build where clause
        const where = {};

        if (deviceId) where.deviceId = deviceId;
        if (status) where.status = status;
        if (command) where.command = command;
        if (priority) where.priority = priority;

        // Date range filter
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = new Date(startDate);
            if (endDate) where.createdAt[Op.lte] = new Date(endDate);
        }

        // Get paginated results
        const { count, rows } = await Command.findAndCountAll({
            where,
            include: [{
                model: Device,
                attributes: ['id', 'deviceName', 'model']
            }],
            order: [[sortBy, sortOrder.toUpperCase()]],
            limit: parseInt(limit),
            offset: (page - 1) * limit
        });

        return res.json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        logger.error('Error listing commands:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to list commands'
        });
    }
};

/**
 * Cancel a pending command
 */
exports.cancelCommand = async (req, res) => {
    try {
        const { commandId } = req.params;

        const command = await Command.findByPk(commandId);
        if (!command) {
            return res.status(404).json({
                success: false,
                error: 'Command not found'
            });
        }

        // Only allow cancelling pending or queued commands
        if (![COMMAND_STATUSES.PENDING, COMMAND_STATUSES.QUEUED].includes(command.status)) {
            return res.status(400).json({
                success: false,
                error: `Cannot cancel command with status: ${command.status}`
            });
        }

        // Update command status
        await command.update({
            status: COMMAND_STATUSES.CANCELLED,
            completedAt: new Date(),
            result: {
                cancelledBy: req.user?.id || 'system',
                cancelledAt: new Date().toISOString()
            }
        });

        logger.info(`Command ${commandId} cancelled by user ${req.user?.id || 'system'}`);

        return res.json({
            success: true,
            message: 'Command cancelled successfully'
        });

    } catch (error) {
        logger.error('Error cancelling command:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to cancel command'
        });
    }
};

/**
 * Retry a failed command
 */
exports.retryCommand = async (req, res) => {
    try {
        const { commandId } = req.params;

        const command = await Command.findByPk(commandId);
        if (!command) {
            return res.status(404).json({
                success: false,
                error: 'Command not found'
            });
        }

        // Only allow retrying failed commands
        if (command.status !== COMMAND_STATUSES.FAILED) {
            return res.status(400).json({
                success: false,
                error: `Cannot retry command with status: ${command.status}`
            });
        }

        // Create a new command with the same parameters
        const newCommand = await Command.create({
            deviceId: command.deviceId,
            command: command.command,
            params: command.params,
            priority: command.priority,
            status: COMMAND_STATUSES.PENDING,
            requiresAck: command.requiresAck,
            metadata: {
                ...command.metadata,
                retryOf: command.id,
                retryCount: (command.metadata?.retryCount || 0) + 1
            }
        });

        // Publish to message queue
        await publishToQueue('command_queue', {
            commandId: newCommand.id,
            deviceId: newCommand.deviceId,
            command: newCommand.command,
            params: newCommand.params,
            priority: newCommand.priority,
            requiresAck: newCommand.requiresAck
        });

        // Update original command to mark as retried
        await command.update({
            status: COMMAND_STATUSES.RETRIED,
            result: {
                ...command.result,
                retriedAs: newCommand.id,
                retriedAt: new Date().toISOString()
            }
        });

        logger.info(`Command ${commandId} retried as ${newCommand.id}`);

        return res.json({
            success: true,
            data: {
                commandId: newCommand.id,
                status: newCommand.status
            }
        });

    } catch (error) {
        logger.error('Error retrying command:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to retry command'
        });
    }
};

/**
 * Get command statistics
 */
exports.getCommandStatistics = async (req, res) => {
    try {
        const {
            deviceId,
            startDate,
            endDate
        } = req.query;

        // Build where clause
        const where = {};
        if (deviceId) where.deviceId = deviceId;

        // Date range filter
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = new Date(startDate);
            if (endDate) where.createdAt[Op.lte] = new Date(endDate);
        }

        // Get command counts by status
        const statusCounts = await Command.findAll({
            attributes: [
                'status',
                [literal('COUNT(*)'), 'count']
            ],
            where,
            group: ['status']
        });

        // Get command counts by type
        const commandTypeCounts = await Command.findAll({
            attributes: [
                'command',
                [literal('COUNT(*)'), 'count']
            ],
            where,
            group: ['command'],
            order: [[literal('count'), 'DESC']],
            limit: 10
        });

        // Get success/failure rate
        const totalCommands = await Command.count({ where });
        const successCount = await Command.count({
            where: {
                ...where,
                status: COMMAND_STATUSES.COMPLETED
            }
        });
        const failedCount = await Command.count({
            where: {
                ...where,
                status: COMMAND_STATUSES.FAILED
            }
        });

        // Calculate average execution time for completed commands
        const avgExecutionTime = await Command.findOne({
            attributes: [
                [literal('AVG(EXTRACT(EPOCH FROM ("completedAt" - "createdAt")))'), 'avgTime']
            ],
            where: {
                ...where,
                status: COMMAND_STATUSES.COMPLETED,
                completedAt: { [Op.ne]: null }
            },
            raw: true
        });

        return res.json({
            success: true,
            data: {
                totalCommands,
                statusCounts: statusCounts.reduce((acc, { status, count }) => {
                    acc[status] = parseInt(count);
                    return acc;
                }, {}),
                commandTypeCounts: commandTypeCounts.map(ctc => ({
                    command: ctc.command,
                    count: parseInt(ctc.get('count'))
                })),
                successRate: totalCommands > 0 ? (successCount / totalCommands) * 100 : 0,
                failureRate: totalCommands > 0 ? (failedCount / totalCommands) * 100 : 0,
                avgExecutionTime: parseFloat(avgExecutionTime?.avgTime || 0)
            }
        });

    } catch (error) {
        logger.error('Error getting command statistics:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get command statistics'
        });
    }
};

/**
 * Acknowledge command execution
 * This is called by the device when it has processed a command
 */
exports.acknowledgeCommand = async (req, res) => {
    try {
        const { commandId } = req.params;
        const { success, result, error } = req.body;

        const command = await Command.findByPk(commandId);
        if (!command) {
            return res.status(404).json({
                success: false,
                error: 'Command not found'
            });
        }

        // Only allow acknowledging pending or in-progress commands
        if (![COMMAND_STATUSES.PENDING, COMMAND_STATUSES.IN_PROGRESS].includes(command.status)) {
            return res.status(400).json({
                success: false,
                error: `Cannot acknowledge command with status: ${command.status}`
            });
        }

        // Update command status
        const updateData = {
            status: success ? COMMAND_STATUSES.COMPLETED : COMMAND_STATUSES.FAILED,
            completedAt: new Date(),
            result: {
                ...command.result,
                ...result,
                acknowledgedAt: new Date().toISOString()
            }
        };

        if (!success) {
            updateData.result.error = error;
        }

        await command.update(updateData);

        logger.info(`Command ${commandId} acknowledged with status: ${updateData.status}`);

        return res.json({
            success: true,
            message: 'Command acknowledged successfully'
        });

    } catch (error) {
        logger.error('Error acknowledging command:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to acknowledge command'
        });
    }
};

/**
 * Get commands for a specific device
 * This is called by the device to fetch pending commands
 */
exports.getPendingCommands = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { limit = 10 } = req.query;

        // Find pending or queued commands for this device
        const commands = await Command.findAll({
            where: {
                deviceId,
                status: {
                    [Op.in]: [COMMAND_STATUSES.PENDING, COMMAND_STATUSES.QUEUED]
                },
                [Op.or]: [
                    { executeAt: { [Op.lte]: new Date() } },
                    { executeAt: null }
                ]
            },
            order: [
                ['priority', 'DESC'],
                ['createdAt', 'ASC']
            ],
            limit: parseInt(limit)
        });

        // Update status to IN_PROGRESS for the fetched commands
        await Command.update(
            { status: COMMAND_STATUSES.IN_PROGRESS },
            {
                where: {
                    id: {
                        [Op.in]: commands.map(cmd => cmd.id)
                    }
                }
            }
        );

        return res.json({
            success: true,
            data: commands
        });

    } catch (error) {
        logger.error('Error fetching pending commands:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch pending commands'
        });
    }
};

module.exports = exports;