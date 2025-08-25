const rateLimit = require('express-rate-limit');

const userRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos [cite: 19]
    max: 500, // Limite de 500 requisições por usuário a cada 15 minutos
    keyGenerator: (req, res) => {
        // Usa o ID do usuário se estiver autenticado, senão o IP
        return req.user ? req.user.id : req.ip;
    },
    message: {
        success: false,
        message: 'Muitas requisições enviadas. Tente novamente mais tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { userRateLimiter };