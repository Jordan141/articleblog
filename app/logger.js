const winston = require('winston')

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: {service: 'user-service'},
    transports: [
        new winston.transports.File({filename: 'error.log', level: 'error'})
    ]
})

// Packages to look at 
// https://github.com/winstonjs/winston-daily-rotate-file
// Docs: https://github.com/winstonjs/winston