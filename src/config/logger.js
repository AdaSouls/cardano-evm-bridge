const winston = require('winston');
const format = winston.format;
const config = require('./config');

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.stack });
  }
  return info;
});

const logger = winston.createLogger({
  level: config.env !== 'production' ? 'debug' : 'info',
  format: format.combine(
    enumerateErrorFormat(),
    config.env !== 'production' ? format.colorize() : format.uncolorize(),
    format.splat(),
    format.timestamp(),
    format.errors({ stack: true }),
    format.printf(({ level, message }) => `${level}: ${message}`),
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
    new winston.transports.File({
      stderrLevels: ['error'],
      filename: config.logger.file,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
    new winston.transports.File({
      stderrLevels: ['error'],
      filename: config.logger.file,
    }),
  ],
});

module.exports = logger;
