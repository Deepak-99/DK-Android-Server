// ecosystem.config.js
module.exports = {
    apps: [
        {
            name: 'hawkshaw-server',
            script: 'server.js',
            // Use cluster mode in prod if you want to scale cores
            instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
            exec_mode: 'cluster',
            max_memory_restart: '512M',
            watch: false,
            env: {
                NODE_ENV: 'development',
                PORT: 3000,
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: process.env.PORT || 3000,
            },
            error_file: './logs/pm2-error.log',
            out_file: './logs/pm2-out.log',
            merge_logs: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
        },
    ],
};
