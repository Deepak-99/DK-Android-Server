// services/fileCleanup.js
const cron = require('node-cron');
const storage = require('../utils/storage');
const config = require('../config');

class FileCleanupService {
    constructor() {
        this.jobs = {};
    }

    start() {
        // Schedule daily cleanup at 2 AM
        this.jobs.callRecordings = cron.schedule('0 2 * * *', () => {
            console.log('Running call recordings cleanup...');
            storage.cleanupOldFiles('callRecordings',
                config.retention.callRecordings * 24 * 60 * 60 * 1000
            );
        });

        this.jobs.screenRecordings = cron.schedule('15 2 * * *', () => {
            console.log('Running screen recordings cleanup...');
            storage.cleanupOldFiles('screenRecordings',
                config.retention.screenRecordings * 24 * 60 * 60 * 1000
            );
        });

        this.jobs.screenshots = cron.schedule('30 2 * * *', () => {
            console.log('Running screenshots cleanup...');
            storage.cleanupOldFiles('screenshots',
                config.retention.screenshots * 24 * 60 * 60 * 1000
            );
        });

        this.jobs.thumbnails = cron.schedule('45 2 * * *', () => {
            console.log('Running thumbnails cleanup...');
            storage.cleanupOldFiles('thumbnails',
                config.retention.thumbnails * 24 * 60 * 60 * 1000
            );
        });

        console.log('File cleanup service started');
    }

    stop() {
        Object.values(this.jobs).forEach(job => job.stop());
        console.log('File cleanup service stopped');
    }
}

module.exports = new FileCleanupService();