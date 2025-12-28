const { CallLog, Device } = require('../../../models');
const { Op, QueryTypes } = require('sequelize');
const logger = require('../../../utils/logger');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { Parser } = require('json2csv');

/**
 * Sync call logs from device to server
 */
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

        // Process call logs in batches
        const BATCH_SIZE = 100;
        const results = {
            created: 0,
            updated: 0,
            failed: 0,
            errors: []
        };

        for (let i = 0; i < callLogs.length; i += BATCH_SIZE) {
            const batch = callLogs.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(log => 
                processCallLog(deviceId, log).catch(error => {
                    logger.error(`[${requestId}] Error processing call log:`, error);
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

        logger.info(`[${requestId}] Synced ${callLogs.length} call logs for device ${deviceId}: ${results.created} created, ${results.updated} updated, ${results.failed} failed`);

        return res.json({
            success: true,
            data: results
        });

    } catch (error) {
        logger.error('Error syncing call logs:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to sync call logs',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Process a single call log (create or update)
 */
async function processCallLog(deviceId, log) {
    // Validate required fields
    if (!log.phoneNumber || !log.type || !log.date || !log.duration) {
        throw new Error('Missing required call log fields');
    }

    // Generate a unique ID based on call details
    const callId = `${deviceId}-${log.phoneNumber}-${new Date(log.date).getTime()}-${log.duration}`;

    const [callLog, created] = await CallLog.findOrCreate({
        where: { id: callId },
        defaults: {
            id: callId,
            deviceId,
            phoneNumber: log.phoneNumber,
            contactName: log.contactName || null,
            type: log.type, // 'incoming', 'outgoing', 'missed', 'rejected', 'blocked', 'answered_externally'
            date: new Date(log.date),
            duration: parseInt(log.duration),
            isRead: log.isRead || false,
            simSlot: log.simSlot || null,
            phoneAccountId: log.phoneAccountId || null,
            features: log.features || 0,
            transcription: log.transcription || null,
            cachedNumberType: log.cachedNumberType || 0,
            cachedNumberLabel: log.cachedNumberLabel || null,
            cachedName: log.cachedName || null,
            cachedMatchedNumber: log.cachedMatchedNumber || null,
            normalizedNumber: log.normalizedNumber || null,
            normalizedNumberE164: log.normalizedNumberE164 || null,
            viaNumber: log.viaNumber || null,
            presentation: log.presentation || 1, // 1 = ALLOWED, 2 = RESTRICTED, 3 = UNKNOWN
            postDialDigits: log.postDialDigits || null,
            subscriptionId: log.subscriptionId || -1,
            isNew: log.isNew || false,
            cachedPhotoId: log.cachedPhotoId || 0,
            cachedPhotoUri: log.cachedPhotoUri || null,
            cachedLookupUri: log.cachedLookupUri || null,
            cachedFormattedNumber: log.cachedFormattedNumber || null,
            lastModified: log.lastModified ? new Date(log.lastModified) : new Date(),
            countryIso: log.countryIso || null,
            geocodedLocation: log.geocodedLocation || null,
            matchedNumber: log.matchedNumber || null,
            matchedNumberE164: log.matchedNumberE164 || null,
            matchedNumberNormalized: log.matchedNumberNormalized || null,
            matchedNumberLabel: log.matchedNumberLabel || null,
            matchedNumberType: log.matchedNumberType || 0,
            matchedNumberLookupUri: log.matchedNumberLookupUri || null,
            matchedNumberPhotoId: log.matchedNumberPhotoId || 0,
            matchedNumberPhotoUri: log.matchedNumberPhotoUri || null,
            isVoicemail: log.isVoicemail || false,
            voicemailUri: log.voicemailUri || null,
            voicemailFileUri: log.voicemailFileUri || null,
            voicemailMimeType: log.voicemailMimeType || null,
            voicemailDuration: log.voicemailDuration || 0,
            voicemailTranscription: log.voicemailTranscription || null,
            voicemailTranscriptionState: log.voicemailTranscriptionState || 0,
            voicemailResult: log.voicemailResult || null,
            voicemailActionUri: log.voicemailActionUri || null,
            phoneAccountComponentName: log.phoneAccountComponentName || null,
            phoneAccountAddress: log.phoneAccountAddress || null,
            phoneAccountLabel: log.phoneAccountLabel || null,
            phoneAccountColor: log.phoneAccountColor || 0,
            phoneAccountHighlightColor: log.phoneAccountHighlightColor || 0,
            phoneAccountIcon: log.phoneAccountIcon || null,
            phoneAccountIconPackageName: log.phoneAccountIconPackageName || null,
            phoneAccountIconResId: log.phoneAccountIconResId || 0,
            phoneAccountIconTint: log.phoneAccountIconTint || 0,
            phoneAccountIconBackgroundColor: log.phoneAccountIconBackgroundColor || 0,
            phoneAccountCallCapabilities: log.phoneAccountCallCapabilities || 0,
            phoneAccountSubscriptionAddress: log.phoneAccountSubscriptionAddress || null,
            phoneAccountSupportedUriSchemes: log.phoneAccountSupportedUriSchemes || null
        }
    });

    if (!created) {
        await callLog.update({
            type: log.type,
            duration: parseInt(log.duration),
            isRead: log.isRead !== undefined ? log.isRead : callLog.isRead,
            lastModified: log.lastModified ? new Date(log.lastModified) : new Date(),
            ...(log.voicemailUri && { voicemailUri: log.voicemailUri }),
            ...(log.voicemailFileUri && { voicemailFileUri: log.voicemailFileUri }),
            ...(log.voicemailTranscription && { voicemailTranscription: log.voicemailTranscription })
        });
    }

    return { callLog, wasNew: created };
}

/**
 * Get call logs with filtering and pagination
 */
exports.getCallLogs = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { 
            phoneNumber,
            type,
            minDuration,
            maxDuration,
            startDate,
            endDate,
            isRead,
            search,
            page = 1,
            limit = 50,
            sortBy = 'date',
            sortOrder = 'DESC'
        } = req.query;

        // Build where clause
        const where = { deviceId };
        
        // Filter by phone number
        if (phoneNumber) {
            where.phoneNumber = { [Op.like]: `%${phoneNumber}%` };
        }

        // Filter by call type
        if (type) {
            where.type = type;
        }

        // Filter by duration
        if (minDuration || maxDuration) {
            where.duration = {};
            if (minDuration) where.duration[Op.gte] = parseInt(minDuration);
            if (maxDuration) where.duration[Op.lte] = parseInt(maxDuration);
        }

        // Filter by date
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date[Op.gte] = new Date(startDate);
            if (endDate) where.date[Op.lte] = new Date(endDate);
        }

        // Filter by read status
        if (isRead !== undefined) {
            where.isRead = isRead === 'true';
        }

        // Search in phone number or contact name
        if (search) {
            where[Op.or] = [
                { phoneNumber: { [Op.like]: `%${search}%` } },
                { contactName: { [Op.like]: `%${search}%` } }
            ];
        }

        // Execute query with pagination
        const { count, rows } = await CallLog.findAndCountAll({
            where,
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
        logger.error('Error fetching call logs:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch call logs'
        });
    }
};

/**
 * Get call log statistics
 */
exports.getCallStatistics = async (req, res) => {
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

        // Get all call logs
        const callLogs = await CallLog.findAll({ where, raw: true });

        // Calculate statistics
        const stats = {
            totalCalls: callLogs.length,
            totalDuration: 0,
            byType: {},
            byHour: Array(24).fill(0),
            byDay: Array(7).fill(0),
            byDate: {},
            incomingCount: 0,
            outgoingCount: 0,
            missedCount: 0,
            rejectedCount: 0,
            blockedCount: 0,
            answeredExternallyCount: 0,
            totalDurationByType: {
                incoming: 0,
                outgoing: 0,
                missed: 0,
                rejected: 0,
                blocked: 0,
                answered_externally: 0
            },
            averageCallDuration: 0,
            longestCall: 0,
            shortestCall: 0,
            mostCalledNumbers: [],
            callFrequency: {
                daily: 0,
                weekly: 0,
                monthly: 0
            }
        };

        callLogs.forEach(log => {
            // Calculate total duration
            stats.totalDuration += log.duration || 0;

            // Count by type
            stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;

            // Count by hour of day
            const hour = new Date(log.date).getHours();
            stats.byHour[hour]++;

            // Count by day of week (0 = Sunday, 1 = Monday, etc.)
            const day = new Date(log.date).getDay();
            stats.byDay[day]++;

            // Group by date
            const date = new Date(log.date).toISOString().split('T')[0];
            stats.byDate[date] = (stats.byDate[date] || 0) + 1;

            // Count call types
            switch (log.type) {
                case 'incoming':
                    stats.incomingCount++;
                    stats.totalDurationByType.incoming += log.duration || 0;
                    break;
                case 'outgoing':
                    stats.outgoingCount++;
                    stats.totalDurationByType.outgoing += log.duration || 0;
                    break;
                case 'missed':
                    stats.missedCount++;
                    break;
                case 'rejected':
                    stats.rejectedCount++;
                    break;
                case 'blocked':
                    stats.blockedCount++;
                    break;
                case 'answered_externally':
                    stats.answeredExternallyCount++;
                    stats.totalDurationByType.answered_externally += log.duration || 0;
                    break;
            }

            // Track longest/shortest call
            if (log.duration > stats.longestCall) {
                stats.longestCall = log.duration;
            }
            if (log.duration < stats.shortestCall || stats.shortestCall === 0) {
                stats.shortestCall = log.duration;
            }
        });

        // Calculate averages
        if (callLogs.length > 0) {
            stats.averageCallDuration = Math.round(stats.totalDuration / callLogs.length);
        }

        // Find most called numbers
        const numberCounts = {};
        callLogs.forEach(log => {
            numberCounts[log.phoneNumber] = (numberCounts[log.phoneNumber] || 0) + 1;
        });

        stats.mostCalledNumbers = Object.entries(numberCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([number, count]) => ({
                phoneNumber: number,
                callCount: count,
                contactName: callLogs.find(log => log.phoneNumber === number)?.contactName || null
            }));

        // Calculate call frequency
        if (callLogs.length > 1) {
            const sortedLogs = [...callLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
            const firstDate = new Date(sortedLogs[0].date);
            const lastDate = new Date(sortedLogs[sortedLogs.length - 1].date);
            const daysDiff = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) || 1;

            stats.callFrequency = {
                daily: parseFloat((callLogs.length / daysDiff).toFixed(2)),
                weekly: parseFloat((callLogs.length / (daysDiff / 7)).toFixed(2)),
                monthly: parseFloat((callLogs.length / (daysDiff / 30)).toFixed(2))
            };
        }

        return res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        logger.error('Error fetching call statistics:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch call statistics'
        });
    }
};

/**
 * Delete call logs
 */
exports.deleteCallLogs = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { logIds, all = false } = req.body;

        // Validate input
        if (!all && (!Array.isArray(logIds) || logIds.length === 0)) {
            return res.status(400).json({
                success: false,
                error: 'Either logIds or all=true must be provided'
            });
        }

        // Build where clause
        const where = { deviceId };
        if (!all) {
            where.id = { [Op.in]: logIds };
        }

        // Delete call logs
        const deletedCount = await CallLog.destroy({ where });

        return res.json({
            success: true,
            message: `Deleted ${deletedCount} call logs`
        });

    } catch (error) {
        logger.error('Error deleting call logs:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete call logs'
        });
    }
};

/**
 * Export call logs
 */
exports.exportCallLogs = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { format = 'json', startDate, endDate } = req.query;

        // Build where clause
        const where = { deviceId };
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date[Op.gte] = new Date(startDate);
            if (endDate) where.date[Op.lte] = new Date(endDate);
        }

        // Get call logs
        const callLogs = await CallLog.findAll({
            where,
            order: [['date', 'DESC']],
            raw: true
        });

        let data;
        let contentType;
        let fileName = `call_logs_${deviceId}_${new Date().toISOString().split('T')[0]}`;

        // Format data based on requested format
        switch (format.toLowerCase()) {
            case 'csv':
                // Convert to CSV
                const fields = ['date', 'phoneNumber', 'contactName', 'type', 'duration', 'isRead'];
                const json2csvParser = new Parser({ fields });
                data = json2csvParser.parse(callLogs);
                contentType = 'text/csv';
                fileName += '.csv';
                break;

            case 'xlsx':
                // Convert to Excel
                const XLSX = require('xlsx');
                const worksheet = XLSX.utils.json_to_sheet(callLogs);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Call Logs');
                data = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                fileName += '.xlsx';
                break;

            case 'json':
            default:
                data = JSON.stringify(callLogs, null, 2);
                contentType = 'application/json';
                fileName += '.json';
        }

        // Set headers and send file
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        return res.send(data);

    } catch (error) {
        logger.error('Error exporting call logs:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to export call logs'
        });
    }
};

/**
 * Get call log by ID
 */
exports.getCallLog = async (req, res) => {
    try {
        const { deviceId, logId } = req.params;

        // Find the call log
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
        logger.error('Error fetching call log:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch call log'
        });
    }
};

/**
 * Update call log
 */
exports.updateCallLog = async (req, res) => {
    try {
        const { deviceId, logId } = req.params;
        const updates = req.body;

        // Find the call log
        const callLog = await CallLog.findOne({
            where: { id: logId, deviceId }
        });

        if (!callLog) {
            return res.status(404).json({
                success: false,
                error: 'Call log not found'
            });
        }

        // Update allowed fields
        const allowedUpdates = [
            'contactName', 'isRead', 'notes', 'tags', 'isImportant', 'isSpam'
        ];

        for (const field of allowedUpdates) {
            if (updates[field] !== undefined) {
                callLog[field] = updates[field];
            }
        }

        await callLog.save();

        return res.json({
            success: true,
            data: callLog
        });

    } catch (error) {
        logger.error('Error updating call log:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update call log'
        });
    }
};

/**
 * Get call log summary
 */
exports.getCallSummary = async (req, res) => {
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

        // Get call logs
        const callLogs = await CallLog.findAll({ where, raw: true });

        // Calculate summary
        const summary = {
            totalCalls: callLogs.length,
            totalDuration: callLogs.reduce((sum, log) => sum + (log.duration || 0), 0),
            byType: callLogs.reduce((acc, log) => {
                acc[log.type] = (acc[log.type] || 0) + 1;
                return acc;
            }, {}),
            byDay: callLogs.reduce((acc, log) => {
                const day = new Date(log.date).toLocaleDateString('en-US', { weekday: 'long' });
                acc[day] = (acc[day] || 0) + 1;
                return acc;
            }, {}),
            byHour: Array(24).fill(0).map((_, i) => {
                const hour = i.toString().padStart(2, '0') + ':00';
                const count = callLogs.filter(log => {
                    const logHour = new Date(log.date).getHours();
                    return logHour === i;
                }).length;
                return { hour, count };
            }),
            recentCalls: callLogs
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5)
                .map(log => ({
                    id: log.id,
                    phoneNumber: log.phoneNumber,
                    contactName: log.contactName,
                    type: log.type,
                    date: log.date,
                    duration: log.duration
                })),
            topContacts: Object.entries(
                callLogs.reduce((acc, log) => {
                    const key = log.contactName || log.phoneNumber;
                    acc[key] = (acc[key] || 0) + 1;
                    return acc;
                }, {})
            )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count]) => ({ name, count }))
        };

        return res.json({
            success: true,
            data: summary
        });

    } catch (error) {
        logger.error('Error fetching call summary:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch call summary'
        });
    }
};