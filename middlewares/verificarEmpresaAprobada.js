const { Empresa } = require('../models');
const { ESTADOS } = require('../constants/empresa.constants');

/**
 * Verifica que la empresa del Gerente esté aprobada antes de permitir
 * acceso a endpoints de ubicaciones y salas.
 *
 * Reglas:
 *   - estado PENDIENTE (0) → 403, solo puede consultar estado de solicitud
 *   - estado RECHAZADO (2) → 403, solo puede reenviar solicitud
 *   - estado ACTIVO    (1) → pasa al siguiente middleware
 *
 * Roles distintos de 'gerente' siempre pasan sin restricción.
 */
const verificarEmpresaAprobada = async (req, res, next) => {
    if (req.usuario.rol !== 'gerente') {
        return next();
    }

    try {
        const empresaId = req.usuario.rolData?.id_empresa;

        if (!empresaId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes una empresa asociada a tu cuenta.'
            });
        }

        const empresa = await Empresa.findByPk(empresaId, { attributes: ['id', 'estado'] });

        if (!empresa) {
            return res.status(403).json({
                success: false,
                message: 'Empresa no encontrada.'
            });
        }

        if (empresa.estado === ESTADOS.PENDIENTE) {
            return res.status(403).json({
                success: false,
                message: 'Tu empresa está pendiente de aprobación. Por ahora solo puedes consultar el estado de tu solicitud.'
            });
        }

        if (empresa.estado === ESTADOS.RECHAZADO) {
            return res.status(403).json({
                success: false,
                message: 'Tu empresa fue rechazada. Solo puedes corregir y reenviar tu solicitud de afiliación.'
            });
        }

        return next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al verificar el estado de la empresa.'
        });
    }
};

module.exports = verificarEmpresaAprobada;
