const AuditoriaService = require('../services/auditoriaService');
const ApiResponse = require('../utils/response');
const { MENSAJES } = require('../constants/auditoria.constants');

class AuditoriaController {
    async getAll(req, res, next) {
        try {
            const { tipo, accion, limite, id_admin, entidad, fechaInicio, fechaFin } = req.query;

            const filtros = {
                tipo,
                accion,
                limite: parseInt(limite) || 100,
                id_admin: id_admin ? parseInt(id_admin) : undefined,
                entidad,
                fechaInicio,
                fechaFin
            };

            const registros = await AuditoriaService.obtenerRegistros(filtros);

            return ApiResponse.success(res, registros, MENSAJES.REGISTROS_OBTENIDOS);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuditoriaController();
