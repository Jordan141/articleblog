const winston = require('winston')
const morgan = require('morgan')
const path = require('path')

const options = {
    file: {
        level: 'info',
        filename: path.join(__dirname, 'logs') + '/app.log',
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false
    },
    console: {
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true,
    }
}

const logger = new winston.createLogger({
    transports: [
        new winston.transports.File(options.file),
        new winston.transports.Console(options.console)
    ],
    exitOnError: false, // do not exit on handled exceptions
})

logger.stream = {
    write: (message, encoding) => {
        logger.info(message)
    }
}

module.exports = logger
// Packages to look at 
// https://github.com/winstonjs/winston-daily-rotate-file
// Docs: https://github.com/winstonjs/winston