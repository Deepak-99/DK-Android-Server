const { CallLog, Device } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { Parser } = require('json2csv');

/* -------------------------------------------------------
   Sync Call Logs
------------------------------------------------------- */

exports.syncCallLogs = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { callLogs } = req.body;
        const requestId = req.requestId || 'unknown';

        // Validate input
        if (!Array.isArray(callLogs)) {
            return res.status(400).json({
                success: false,
                error: 'Call logs must be an array'
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

        const BATCH_SIZE = 100;
        const results = { created: 0, updated: 0, failed: 0, errors: [] };

        for (let i = 0; i < callLogs.length; i += BATCH_SIZE) {
            const batch = callLogs.slice(i, i + BATCH_SIZE);

            const responses = await Promise.all(
                batch.map(log =>
                    processCallLog(deviceId, log).catch(err => {
                        logger.error(`[${requestId}] Call log sync error`, err);
                        return { error: err.message };
                    })
                )
            );

            responses.forEach(r => {
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

        logger.info(`[${requestId}] Call logs synced for device ${deviceId}`);

        return res.json({ success: true, data: results });

    } catch (error) {
        logger.error('Call log sync failed', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to sync call logs'
        });
    }
};

/* -------------------------------------------------------
   Single Call Log Processor
------------------------------------------------------- */

async function processCallLog(deviceId, log) {

    if (!log.phoneNumber || !log.type || !log.date) {
        throw new Error('Missing required call log fields');
    }

    const callId = `${deviceId}-${log.phoneNumber}-${new Date(log.date).getTime()}-${log.duration || 0}`;

    const payload = {
        id: callId,
        deviceId,
        phoneNumber: log.phoneNumber,
        contactName: log.contactName || null,
        type: log.type,
        date: new Date(log.date),
        duration: Number(log.duration) || 0,
        isRead: Boolean(log.isRead),
        simSlot: log.simSlot || null,
        countryIso: log.countryIso || null,
        geocodedLocation: log.geocodedLocation || null,
        lastModified: log.lastModified ? new Date(log.lastModified) : new Date()
    };

    const [callLog, created] = await CallLog.findOrCreate({
        where: { id: callId },
        defaults: payload
    });

    if (!created) {
        await callLog.update(payload);
    }

    return { wasNew: created };
}

/* -------------------------------------------------------
   Get Call Logs
------------------------------------------------------- */

exports.getCallLogs = async (req, res) => {
    try {
        const { deviceId } = req.params;

        const {
            phoneNumber,
            type,
            startDate,
            endDate,
            isRead,
            search,
            page = 1,
            limit = 50,
            sortBy = 'date',
            sortOrder = 'DESC'
        } = req.query;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);

        const where = { deviceId };

        if (phoneNumber) {
            where.phoneNumber = { [Op.like]: `%${phoneNumber}%` };
        }

        if (type) {
            where.type = type;
        }

        if (isRead !== undefined) {
            where.isRead = isRead === 'true';
        }

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date[Op.gte] = new Date(startDate);
            if (endDate) where.date[Op.lte] = new Date(endDate);
        }

        if (search) {
            where[Op.or] = [
                { phoneNumber: { [Op.like]: `%${search}%` } },
                { contactName: { [Op.like]: `%${search}%` } }
            ];
        }

        const allowedSortFields = ['date', 'duration', 'phoneNumber'];
        const safeSort = allowedSortFields.includes(sortBy) ? sortBy : 'date';

        const { count, rows } = await CallLog.findAndCountAll({
            where,
            order: [[safeSort, sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
            limit: limitNum,
            offset: (pageNum - 1) * limitNum
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
        logger.error('Fetch call logs failed', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch call logs'
        });
    }
};

/* -------------------------------------------------------
   Get Single Call Log
------------------------------------------------------- */

exports.getCallLog = async (req, res) => {
    try {
        const { deviceId, logId } = req.params;

        const callLog = await CallLog.findOne({
            where: { id: logId, deviceId }
        });

        if (!callLog) {
            return res.status(404).json({
                success: false,
                error: 'Call log not found'
            });
        }

        return res.json({
            success: true,
            data: callLog
        });

    } catch (error) {
        logger.error('Fetch call log failed', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch call log'
        });
    }
};

/* -------------------------------------------------------
   Update Call Log
------------------------------------------------------- */

exports.updateCallLog = async (req, res) => {
    try {
        const { deviceId, logId } = req.params;
        const updates = req.body;

        const callLog = await CallLog.findOne({
            where: { id: logId, deviceId }
        });

        if (!callLog) {
            return res.status(404).json({
                success: false,
                error: 'Call log not found'
            });
        }

        const allowed = [
            'contactName',
            'isRead',
            'notes',
            'tags',
            'isImportant',
            'isSpam'
        ];

        allowed.forEach(field => {
            if (updates[field] !== undefined) {
                callLog[field] = updates[field];
            }
        });

        await callLog.save();

        return res.json({
            success: true,
            data: callLog
        });

    } catch (error) {
        logger.error('Update call log failed', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update call log'
        });
    }
};

/* -------------------------------------------------------
   Call Statistics
------------------------------------------------------- */

exports.getCallStatistics = async (req, res) => {
    try {
        const { deviceId } = req.params;

        const logs = await CallLog.findAll({
            where: { deviceId },
            attributes: ['type', 'duration'],
            raw: true
        });

        const stats = {
            totalCalls: logs.length,
            totalDuration: 0,
            byType: {}
        };

        logs.forEach(log => {
            stats.totalDuration += log.duration || 0;
            stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
        });

        return res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        logger.error('Fetch call statistics failed', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch call statistics'
        });
    }
};

/* -------------------------------------------------------
   Delete Call Logs
------------------------------------------------------- */

exports.deleteCallLogs = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { logIds, all = false } = req.body;

        if (!all && (!Array.isArray(logIds) || !logIds.length)) {
            return res.status(400).json({
                success: false,
                error: 'Either logIds or all=true must be provided'
            });
        }

        const where = { deviceId };

        if (!all) {
            where.id = { [Op.in]: logIds };
        }

        const deleted = await CallLog.destroy({ where });

        return res.json({
            success: true,
            message: `Deleted ${deleted} call logs`
        });

    } catch (error) {
        logger.error('Delete call logs failed', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete call logs'
        });
    }
};

/* -------------------------------------------------------
   Export Call Logs
------------------------------------------------------- */

exports.exportCallLogs = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { format = 'json' } = req.query;

        const logs = await CallLog.findAll({
            where: { deviceId },
            raw: true
        });

        let data, contentType;
        let fileName = `call_logs_${deviceId}_${new Date().toISOString().split('T')[0]}`;

        if (format === 'csv') {
            const parser = new Parser();
            data = parser.parse(logs);
            contentType = 'text/csv';
            fileName += '.csv';
        } else {
            data = JSON.stringify(logs, null, 2);
            contentType = 'application/json';
            fileName += '.json';
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.send(data);

    } catch (error) {
        logger.error('Export call logs failed', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to export call logs'
        });
    }
};

/* -------------------------------------------------------
   Call Summary
------------------------------------------------------- */

exports.getCallSummary = async (req, res) => {
    try {
        const { deviceId } = req.params;

        const logs = await CallLog.findAll({
            where: { deviceId },
            attributes: ['phoneNumber', 'contactName', 'type', 'date', 'duration'],
            raw: true
        });

        const summary = {
            totalCalls: logs.length,
            totalDuration: 0,
            byType: {},
            byHour: Array(24).fill(0),
            recentCalls: []
        };

        logs.forEach(log => {
            summary.totalDuration += log.duration || 0;
            summary.byType[log.type] =
                (summary.byType[log.type] || 0) + 1;

            const hour = new Date(log.date).getHours();
            summary.byHour[hour]++;
        });

        summary.recentCalls = logs
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        return res.json({
            success: true,
            data: summary
        });

    } catch (error) {
        logger.error('Fetch call summary failed', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch call summary'
        });
    }
};
