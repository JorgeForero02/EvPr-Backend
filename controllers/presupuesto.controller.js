const PresupuestoService = require('../services/presupuesto.service');
const AuditoriaService = require('../services/auditoriaService');
const ApiResponse = require('../utils/response');

class PresupuestoController {
    async crear(req, res, next) {
        try {
            const { eventoId } = req.params;
            const { id_actividad, concepto, monto, tipo, descripcion } = req.body;
            const usuario = req.usuario;

            if (!concepto || !monto || !tipo) {
                return ApiResponse.error(res, 'concepto, monto y tipo son obligatorios', 400);
            }

            if (!['ingreso', 'gasto'].includes(tipo)) {
                return ApiResponse.error(res, 'tipo debe ser "ingreso" o "gasto"', 400);
            }

            const resultado = await PresupuestoService.crear({
                id_evento: parseInt(eventoId),
                id_actividad: id_actividad ? parseInt(id_actividad) : null,
                concepto,
                monto,
                tipo,
                descripcion
            });

            if (!resultado.exito) {
                return ApiResponse.error(res, resultado.mensaje, resultado.codigoEstado || 400);
            }

            await AuditoriaService.registrarCreacion('presupuesto_item', resultado.item.toJSON(), usuario, req.ip);

            return ApiResponse.success(res, resultado.item, 'Ítem de presupuesto registrado', 201);
        } catch (error) {
            next(error);
        }
    }

    async obtenerPorEvento(req, res, next) {
        try {
            const { eventoId } = req.params;
            const data = await PresupuestoService.obtenerPorEvento(parseInt(eventoId));
            return ApiResponse.success(res, data, 'Presupuesto obtenido');
        } catch (error) {
            next(error);
        }
    }

    async obtenerPorId(req, res, next) {
        try {
            const { id } = req.params;
            const item = await PresupuestoService.buscarPorId(parseInt(id));
            if (!item) return ApiResponse.error(res, 'Ítem no encontrado', 404);
            return ApiResponse.success(res, item, 'Ítem obtenido');
        } catch (error) {
            next(error);
        }
    }

    async actualizar(req, res, next) {
        try {
            const { id } = req.params;
            const usuario = req.usuario;
            const resultado = await PresupuestoService.actualizar(parseInt(id), req.body);

            if (!resultado.exito) {
                return ApiResponse.error(res, resultado.mensaje, resultado.codigoEstado || 400);
            }

            await AuditoriaService.registrar({
                mensaje: `Actualización de ítem de presupuesto ID ${id}`,
                tipo: 'PUT',
                accion: 'actualizar_presupuesto_item',
                usuario,
                entidad: 'presupuesto_item',
                ip: req.ip
            });

            return ApiResponse.success(res, resultado.item, 'Ítem actualizado');
        } catch (error) {
            next(error);
        }
    }

    async eliminar(req, res, next) {
        try {
            const { id } = req.params;
            const usuario = req.usuario;
            const resultado = await PresupuestoService.eliminar(parseInt(id));

            if (!resultado.exito) {
                return ApiResponse.error(res, resultado.mensaje, resultado.codigoEstado || 400);
            }

            await AuditoriaService.registrarEliminacion('presupuesto_item', id, usuario, req.ip);

            return ApiResponse.success(res, null, 'Ítem eliminado');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PresupuestoController();
