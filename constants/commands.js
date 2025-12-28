// constants/commands.js
module.exports = {
    COMMAND_PRIORITIES: {
        LOW: 'low',
        NORMAL: 'normal',
        HIGH: 'high',
        CRITICAL: 'critical'
    },
    COMMAND_STATUSES: {
        PENDING: 'pending',
        QUEUED: 'queued',
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed',
        FAILED: 'failed',
        CANCELLED: 'cancelled',
        EXPIRED: 'expired',
        RETRIED: 'retried'
    }
};