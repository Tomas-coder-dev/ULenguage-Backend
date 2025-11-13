const { createLogger, format, transports } = require('winston');
const path = require('path');

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const jsonFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.splat(),
  format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  format.json()
);

const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, stack, metadata }) => {
    let meta = '';
    try { meta = metadata && Object.keys(metadata).length ? ` | meta=${JSON.stringify(metadata)}` : ''; } catch (e) { meta = ''; }
    return `${timestamp} [${level}]: ${stack || message}${meta}`;
  })
);

const logger = createLogger({
  level: LOG_LEVEL,
  transports: [
    new transports.Console({ format: consoleFormat }),
    new transports.File({ filename: path.join('logs', 'error.log'), level: 'error', format: jsonFormat }),
    new transports.File({ filename: path.join('logs', 'combined.log'), format: jsonFormat })
  ],
  exitOnError: false
});

// Convenience wrappers to preserve old console.* usage patterns
module.exports = {
  logger,
  info: (...args) => logger.info(args.length === 1 ? args[0] : args),
  warn: (...args) => logger.warn(args.length === 1 ? args[0] : args),
  error: (...args) => logger.error(args.length === 1 ? args[0] : args),
  debug: (...args) => logger.debug(args.length === 1 ? args[0] : args)
};
