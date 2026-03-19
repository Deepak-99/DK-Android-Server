const { Sms, Device } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/* -------------------------------------------------------
 Helper: Pagination
------------------------------------------------------- */

function normalizePagination(page, limit) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 50;
    const offset = (pageNum - 1) * limitNum;

    return { pageNum, limitNum, offset };
}

/* -------------------------------------------------------
 Sync SMS
------------------------------------------------------- */

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

            const batchResults = await Promise.all(
                batch.map(m =>
                    processSms(deviceId, m).catch(err => {
                        logger.error(`[${requestId}] SMS sync error`, err);
                        return { error: err.message };
                    })
                )
            );

            batchResults.forEach(r => {
                if (r?.error) {
                    results.failed++;
                    results.errors.push(r.error);
                } else if (r.wasNew) {
                    results.created++;
                } else {
                    results.updated++;
                }
            });
        }

        return res.json({ success: true, data: results });

    } catch (error) {
        logger.error('SMS sync failed', error);
        return res.status(500).json({ success: false, error: 'Failed to sync SMS' });
    }
};

/* -------------------------------------------------------
 Process Single SMS
------------------------------------------------------- */

async function processSms(deviceId, message) {
    // Validate required fields
    if (!message.messageId || !message.address || !message.body || !message.type || !message.date) {
        throw new Error('Missing required SMS fields');
    }

    const [sms, created] = await Sms.findOrCreate({
        where: {
            deviceId,
            messageId: message.messageId
        },
        defaults: {
            id: uuidv4(),
            deviceId,
            messageId: message.messageId,
            address: message.address,
            body: message.body,
            type: message.type,
            threadId: message.threadId || null,
            date: new Date(message.date),
            isRead: message.isRead || false
        }
    });

    if (!created) {
        await sms.update({
            body: message.body,
            isRead: message.isRead ?? sms.isRead,
            type: message.type
        });
    }

    return { wasNew: created };
}

/* -------------------------------------------------------
 Get SMS Messages
------------------------------------------------------- */

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
            page,
            limit
        } = req.query;

        const { pageNum, limitNum, offset } = normalizePagination(page, limit);

        const where = { deviceId };

        if (type) where.type = type;
        if (threadId) where.threadId = threadId;
        if (address) where.address = address;

        if (read !== undefined) {
            where.isRead = read === 'true';
        }

        if (search) {
            where.body = { [Op.like]: `%${search}%` };
        }

        // Filter by date range
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date[Op.gte] = new Date(startDate);
            if (endDate) where.date[Op.lte] = new Date(endDate);
        }

        const { count, rows } = await Sms.findAndCountAll({
            where,
            order: [['date', 'DESC']],
            limit: limitNum,
            offset
        });

        return res.json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: pageNum,
                totalPages: Math.ceil(count / limitNum)
            }
        });

    } catch (error) {
        logger.error('Fetch SMS failed', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch SMS' });
    }
};

/* -------------------------------------------------------
 Get SMS Threads
------------------------------------------------------- */

exports.getSmsThreads = async (req, res) => {
    try {
        const { deviceId } = req.params;

        const threads = await Sms.findAll({
            attributes: [
                'threadId',
                'address',
                [Sms.sequelize.fn('MAX', Sms.sequelize.col('date')), 'lastDate'],
                [Sms.sequelize.fn('COUNT', Sms.sequelize.col('id')), 'count']
            ],
            where: { deviceId },
            group: ['threadId', 'address'],
            order: [[Sms.sequelize.literal('lastDate'), 'DESC']],
            raw: true
        });

        return res.json({ success: true, data: threads });

    } catch (error) {
        logger.error('Fetch SMS threads failed', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch threads' });
    }
};

/* -------------------------------------------------------
 Thread Messages
------------------------------------------------------- */

exports.getThreadMessages = async (req, res) => {
    try {
        const { deviceId, threadId } = req.params;
        const { page, limit } = req.query;

        const { pageNum, limitNum, offset } = normalizePagination(page, limit);

        const { count, rows } = await Sms.findAndCountAll({
            where: { deviceId, threadId },
            order: [['date', 'ASC']],
            limit: limitNum,
            offset
        });

        await Sms.update(
            { isRead: true },
            { where: { deviceId, threadId, isRead: false, type: 'inbox' } }
        );

        return res.json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: pageNum,
                totalPages: Math.ceil(count / limitNum)
            }
        });

    } catch (error) {
        logger.error('Thread fetch failed', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch thread' });
    }
};

/* -------------------------------------------------------
 Send SMS
------------------------------------------------------- */

exports.sendSms = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { address, body, threadId } = req.body;

        // Validate input
        if (!address || !body) {
            return res.status(400).json({ success: false, error: 'Address and body required' });
        }

        // Create new outbound SMS
        const sms = await Sms.create({
            id: uuidv4(),
            deviceId,
            address,
            body,
            threadId: threadId || uuidv4(),
            type: 'outbox',
            status: 'pending',
            date: new Date(),
            isRead: true
        });

        // TODO: Queue the message for sending to the device
        // await queueSmsForSending(deviceId, sms.id);
        return res.status(201).json({ success: true, data: sms });

    } catch (error) {
        logger.error('Send SMS failed', error);
        return res.status(500).json({ success: false, error: 'Failed to send SMS' });
    }
};

/* -------------------------------------------------------
 Delete SMS
------------------------------------------------------- */

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
            if (threadId) where.threadId = threadId;
            else where.id = { [Op.in]: messageIds };
        }

        const deleted = await Sms.destroy({ where });

        return res.json({ success: true, message: `Deleted ${deleted} messages` });

    } catch (error) {
        logger.error('Delete SMS failed', error);
        return res.status(500).json({ success: false, error: 'Failed to delete SMS' });
    }
};

/* -------------------------------------------------------
 SMS Statistics
------------------------------------------------------- */

exports.getSmsStatistics = async (req, res) => {
    try {
        const { deviceId } = req.params;

        const totalMessages = await Sms.count({ where: { deviceId } });

        const byType = await Sms.findAll({
            attributes: [
                'type',
                [Sms.sequelize.fn('COUNT', Sms.sequelize.col('id')), 'count']
            ],
            where: { deviceId },
            group: ['type'],
            raw: true
        });

        return res.json({
            success: true,
            data: { totalMessages, byType }
        });

    } catch (error) {
        logger.error('SMS stats failed', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch SMS stats' });
    }
};
