const { Sms, Device } = require('../../../models');
const { Op } = require('sequelize');
const logger = require('../../../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Sync SMS messages from device to server
 */
exports.syncSms = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { messages } = req.body;
        const requestId = req.requestId || 'unknown';

        // Validate input
        if (!Array.isArray(messages)) {
            return res.status(400).json({
                success: false,
                error: 'Messages must be an array'
            });
        }

        // Check if device exists
        const device = await Device.findByPk(deviceId);
        if (!device) {
            return res.status(404).json({
                success: false,
                error: 'Device not found'
            });
        }

        // Process messages in batches
        const BATCH_SIZE = 50;
        const results = {
            created: 0,
            updated: 0,
            failed: 0,
            errors: []
        };

        for (let i = 0; i < messages.length; i += BATCH_SIZE) {
            const batch = messages.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(message => 
                processSms(deviceId, message).catch(error => {
                    logger.error(`[${requestId}] Error processing SMS:`, error);
                    return { error: error.message };
                })
            );

            const batchResults = await Promise.all(batchPromises);
            
            batchResults.forEach(result => {
                if (result && !result.error) {
                    if (result.wasNew) results.created++;
                    else results.updated++;
                } else {
                    results.failed++;
                    if (result?.error) {
                        results.errors.push(result.error);
                    }
                }
            });
        }

        logger.info(`[${requestId}] Synced ${messages.length} SMS messages for device ${deviceId}: ${results.created} created, ${results.updated} updated, ${results.failed} failed`);

        return res.json({
            success: true,
            data: results
        });

    } catch (error) {
        logger.error('Error syncing SMS messages:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to sync SMS messages',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Process a single SMS message (create or update)
 */
async function processSms(deviceId, message) {
    // Validate required fields
    if (!message.messageId || !message.address || !message.body || !message.type || !message.date) {
        throw new Error('Missing required SMS message fields');
    }

    const [sms, created] = await Sms.findOrCreate({
        where: {
            deviceId,
            messageId: message.messageId
        },
        defaults: {
            ...message,
            deviceId,
            id: uuidv4()
        }
    });

    if (!created) {
        await sms.update(message);
    }

    return { wasNew: created, sms };
}

/**
 * Get SMS messages with filtering and pagination
 */
exports.getSmsMessages = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { 
            type, 
            threadId,
            address,
            search,
            startDate, 
            endDate, 
            read,
            page = 1, 
            limit = 50 
        } = req.query;

        // Build where clause
        const where = { deviceId };
        
        // Filter by message type
        if (type) {
            where.type = type; // 'inbox', 'sent', 'draft', 'outbox', 'failed', 'queued'
        }

        // Filter by thread/conversation
        if (threadId) {
            where.threadId = threadId;
        }

        // Filter by phone number
        if (address) {
            where.address = address;
        }

        // Filter by date range
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date[Op.gte] = new Date(startDate);
            if (endDate) where.date[Op.lte] = new Date(endDate);
        }

        // Filter by read status
        if (read !== undefined) {
            where.isRead = read === 'true';
        }

        // Search in message body
        if (search) {
            where.body = { [Op.like]: `%${search}%` };
        }

        // Execute query with pagination
        const { count, rows } = await Sms.findAndCountAll({
            where,
            order: [['date', 'DESC']],
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
        logger.error('Error fetching SMS messages:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch SMS messages'
        });
    }
};

/**
 * Get SMS conversations/threads
 */
exports.getSmsThreads = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { search, page = 1, limit = 50 } = req.query;

        // Build where clause
        const where = { deviceId };

        // Search in message body or address
        if (search) {
            where[Op.or] = [
                { body: { [Op.like]: `%${search}%` } },
                { address: { [Op.like]: `%${search}%` } }
            ];
        }

        // Get unique threads with latest message
        const threads = await Sms.findAll({
            attributes: [
                'threadId',
                'address',
                [Sms.sequelize.fn('MAX', Sms.sequelize.col('date')), 'lastMessageDate'],
                [Sms.sequelize.fn('COUNT', Sms.sequelize.col('id')), 'messageCount'],
                [Sms.sequelize.literal(`
                    (SELECT body FROM sms 
                     WHERE (threadId = sms.threadId AND deviceId = :deviceId) 
                     ORDER BY date DESC LIMIT 1)
                `), 'snippet'],
                [Sms.sequelize.literal(`
                    (SELECT COUNT(*) FROM sms as unread 
                     WHERE unread.threadId = sms.threadId 
                     AND unread.deviceId = :deviceId 
                     AND unread.isRead = false)
                `), 'unreadCount']
            ],
            where,
            group: ['threadId', 'address'],
            order: [[Sms.sequelize.literal('"lastMessageDate"'), 'DESC']],
            limit: parseInt(limit),
            offset: (page - 1) * limit,
            replacements: { deviceId },
            raw: true
        });

        // Get total count of threads
        const totalThreads = await Sms.count({
            distinct: true,
            col: 'threadId',
            where
        });

        return res.json({
            success: true,
            data: threads,
            pagination: {
                total: totalThreads,
                page: parseInt(page),
                totalPages: Math.ceil(totalThreads / limit)
            }
        });

    } catch (error) {
        logger.error('Error fetching SMS threads:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch SMS threads'
        });
    }
};

/**
 * Get messages in a specific thread
 */
exports.getThreadMessages = async (req, res) => {
    try {
        const { deviceId, threadId } = req.params;
        const { page = 1, limit = 100 } = req.query;

        // Get messages in the thread
        const { count, rows } = await Sms.findAndCountAll({
            where: {
                deviceId,
                threadId
            },
            order: [['date', 'ASC']], // Oldest first for conversation view
            limit: parseInt(limit),
            offset: (page - 1) * limit
        });

        // Mark messages as read
        await Sms.update(
            { isRead: true },
            {
                where: {
                    deviceId,
                    threadId,
                    isRead: false,
                    type: 'inbox' // Only mark received messages as read
                }
            }
        );

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
        logger.error('Error fetching thread messages:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch thread messages'
        });
    }
};

/**
 * Send a new SMS message
 */
exports.sendSms = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { address, body, threadId } = req.body;

        // Validate input
        if (!address || !body) {
            return res.status(400).json({
                success: false,
                error: 'Address and body are required'
            });
        }

        // Create new outbound SMS
        const sms = await Sms.create({
            id: uuidv4(),
            deviceId,
            address,
            body,
            threadId: threadId || uuidv4(), // Create new thread if not provided
            type: 'outbox', // Will be updated to 'sent' when device confirms delivery
            status: 'pending',
            date: new Date(),
            isRead: true
        });

        // TODO: Queue the message for sending to the device
        // await queueSmsForSending(deviceId, sms.id);

        return res.status(201).json({
            success: true,
            data: sms
        });

    } catch (error) {
        logger.error('Error sending SMS:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to send SMS'
        });
    }
};

/**
 * Delete SMS messages
 */
exports.deleteSms = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { messageIds, threadId, all = false } = req.body;

        // Validate input
        if (!all && (!Array.isArray(messageIds) || messageIds.length === 0) && !threadId) {
            return res.status(400).json({
                success: false,
                error: 'Either messageIds, threadId, or all=true must be provided'
            });
        }

        // Build where clause
        const where = { deviceId };
        
        if (!all) {
            if (threadId) {
                where.threadId = threadId;
            } else {
                where.id = { [Op.in]: messageIds };
            }
        }

        // Delete messages
        const deletedCount = await Sms.destroy({ where });

        return res.json({
            success: true,
            message: `Deleted ${deletedCount} messages`
        });

    } catch (error) {
        logger.error('Error deleting messages:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete messages'
        });
    }
};

/**
 * Get SMS statistics
 */
exports.getSmsStatistics = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { startDate, endDate } = req.query;

        // Build where clause
        const where = { deviceId };
        
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date[Op.gte] = new Date(startDate);
            if (endDate) where.date[Op.lte] = new Date(endDate);
        }

        // Get total message count
        const totalMessages = await Sms.count({ where });

        // Get message count by type
        const messagesByType = await Sms.findAll({
            attributes: [
                'type',
                [Sms.sequelize.fn('COUNT', Sms.sequelize.col('id')), 'count']
            ],
            where,
            group: ['type']
        });

        // Get most messaged contacts
        const mostMessaged = await Sms.findAll({
            attributes: [
                'address',
                [Sms.sequelize.fn('COUNT', Sms.sequelize.col('id')), 'messageCount']
            ],
            where,
            group: ['address'],
            order: [[Sms.sequelize.literal('"messageCount"'), 'DESC']],
            limit: 10
        });

        // Get message frequency by day
        const messageFrequency = await Sms.findAll({
            attributes: [
                [Sms.sequelize.fn('DATE_TRUNC', 'day', Sms.sequelize.col('date')), 'day'],
                [Sms.sequelize.fn('COUNT', Sms.sequelize.col('id')), 'count']
            ],
            where,
            group: [Sms.sequelize.fn('DATE_TRUNC', 'day', Sms.sequelize.col('date'))],
            order: [[Sms.sequelize.fn('DATE_TRUNC', 'day', Sms.sequelize.col('date')), 'ASC']]
        });

        return res.json({
            success: true,
            data: {
                totalMessages,
                messagesByType,
                mostMessaged,
                messageFrequency
            }
        });

    } catch (error) {
        logger.error('Error fetching SMS statistics:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch SMS statistics'
        });
    }
};