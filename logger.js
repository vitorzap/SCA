// logger.js
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
const path = require('path');
const fs = require('fs');
const logDir = path.join(__dirname, 'logs', 'server');

// Ensure the directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger = createLogger({
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new transports.File({
      filename: path.join(logDir, 'server.log'),
      handleExceptions: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

// Add console transport for development and testing environments
if (process.env.NODE_ENV !== 'production' || process.env.NODE_ENV === 'test') {
  logger.add(new transports.Console({
    format: format.simple(),
    handleExceptions: true,
  }));
}

module.exports = logger;