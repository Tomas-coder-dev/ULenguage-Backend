/**
 * PM2 ecosystem sample for ULenguage Backend
 */
module.exports = {
  apps: [
    {
      name: 'ulenguage-backend',
      script: 'src/app.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
        LOG_LEVEL: 'debug'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        LOG_LEVEL: 'info'
      }
    }
  ]
};
