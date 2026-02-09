module.exports = {
  apps: [{
    name: 'Akodemy',
    script: './production.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    min_uptime: '10s',        // Must run 10s before "healthy"
    max_restarts: 15,         // Max 15 restarts in 1min
    exp_backoff_restart_delay: 100,  // 100ms → 60s delay on crashes
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
