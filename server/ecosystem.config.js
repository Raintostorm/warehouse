module.exports = {
    apps: [{
        name: 'uh-server',
        script: './server.js',
        instances: 4, // Chạy 4 instances (cluster mode)
        exec_mode: 'cluster',
        env: {
            NODE_ENV: 'development',
            PORT: 3000
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 3000
        },
        // Auto restart settings
        max_memory_restart: '500M', // Restart nếu memory > 500MB
        error_file: './logs/pm2-error.log',
        out_file: './logs/pm2-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,

        // Watch mode (chỉ dùng development)
        watch: process.env.NODE_ENV === 'development',
        ignore_watch: ['node_modules', 'logs'],

        // Restart settings
        min_uptime: '10s', // Phải chạy ít nhất 10s mới coi là stable
        max_restarts: 10, // Tối đa 10 lần restart trong 1 phút
        restart_delay: 4000, // Đợi 4s trước khi restart
    }]
};
