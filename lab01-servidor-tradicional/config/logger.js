const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        // Escrever todos os logs com nível `info` ou superior no console
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
        // Opcional: Escrever logs de erro em um arquivo
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

module.exports = logger;