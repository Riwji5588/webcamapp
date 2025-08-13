// Database configuration
const config = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'webcamapp_logs',
    charset: 'utf8mb4',
    timezone: '+07:00' // Thailand timezone
  },
  production: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'webcamapp',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'webcamapp_logs',
    charset: 'utf8mb4',
    timezone: '+07:00',
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false
  }
};

const environment = process.env.NODE_ENV || 'development';
module.exports = config[environment];
