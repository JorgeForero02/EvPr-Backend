const AuditoriaService = require('../services/auditoriaService');

const auditoriaMiddleware = (tipoOperacion) => {
    return async (req, res, next) => {
        const originalJson = res.json.bind(res);

        res.json = function (data) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const usuario = req.usuario ? {
                    id: req.usuario.id,
                    nombre: req.usuario.nombre
                } : null;

                const rutaBase = req.baseUrl || req.route?.path || req.path;

                const ip = req.ip || req.headers['x-forwarded-for'] || null;

                AuditoriaService.registrar({
                    mensaje: `${req.method} ${rutaBase} - Status: ${res.statusCode}`,
                    tipo: tipoOperacion || req.method,
                    accion: `${req.method.toLowerCase()}_${rutaBase.replace(/\//g, '_')}`,
                    usuario,
                    ip
                }).catch(err => console.error('Error en auditoría:', err));
            }

            return originalJson(data);
        };

        next();
    };
};

module.exports = auditoriaMiddleware;
