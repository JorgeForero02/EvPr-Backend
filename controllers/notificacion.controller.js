const NotificacionService = require('../services/notificacion.service');
const { MENSAJES } = require('../constants/notificacion.constants');

class NotificacionController {
    async obtenerMisNotificaciones(req, res) {
        try {
            const usuario = req.usuario;
            const { estado, entidad_tipo, limit } = req.query;

            const resultado = await NotificacionService.obtenerPorUsuario(usuario.id, {
                estado,
                entidad_tipo,
                limit: parseInt(limit) || 50
            });

            return res.json({
                success: true,
                message: MENSAJES.LISTA_OBTENIDA,
                total: resultado.notificaciones.length,
                data: resultado.notificaciones
            });
        } catch (error) {
            console.error('Error al obtener notificaciones:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_OBTENER,
                error: error.message
            });
        }
    }

    async marcarComoLeida(req, res) {
        const transaction = await NotificacionService.crearTransaccion();
        try {
            const { notificacionId } = req.params;
            const usuario = req.usuario;

            const resultado = await NotificacionService.marcarComoLeida(
                notificacionId,
                usuario.id,
                transaction
            );

            if (!resultado.exito) {
                await transaction.rollback();
                return res.status(resultado.mensaje === MENSAJES.NO_ENCONTRADA ? 404 : 403).json({
                    success: false,
                    message: resultado.mensaje
                });
            }

            await transaction.commit();

            return res.json({
                success: true,
                message: MENSAJES.MARCADA_LEIDA,
                data: resultado.notificacion
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error al marcar notificación como leída:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_ACTUALIZAR,
                error: error.message
            });
        }
    }

    async obtenerPorId(req, res) {
        try {
            const { notificacionId } = req.params;
            const usuario = req.usuario;

            const notificacion = await NotificacionService.buscarPorId(notificacionId);

            if (!notificacion) {
                return res.status(404).json({
                    success: false,
                    message: MENSAJES.NO_ENCONTRADA
                });
            }

            // [BACKEND-FIX] B8: Corregido 'admin' → 'administrador'
            if (notificacion.id_destinatario !== usuario.id && usuario.rol !== 'administrador') {
                return res.status(403).json({
                    success: false,
                    message: MENSAJES.SIN_PERMISO_VER
                });
            }

            return res.json({
                success: true,
                message: MENSAJES.OBTENIDA,
                data: notificacion
            });
        } catch (error) {
            console.error('Error al obtener notificación:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_OBTENER,
                error: error.message
            });
        }
    }

    async eliminarNotificacion(req, res) {
        const transaction = await NotificacionService.crearTransaccion();
        try {
            const { notificacionId } = req.params;
            const usuario = req.usuario;

            const notificacion = await NotificacionService.buscarPorId(notificacionId, transaction);

            if (!notificacion) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: MENSAJES.NO_ENCONTRADA
                });
            }

            // [BACKEND-FIX] B8: Corregido 'admin' → 'administrador'
            if (notificacion.id_destinatario !== usuario.id && usuario.rol !== 'administrador') {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: MENSAJES.SIN_PERMISO_MODIFICAR
                });
            }

            await notificacion.destroy({ transaction });
            await transaction.commit();

            return res.json({
                success: true,
                message: MENSAJES.ELIMINADA
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error al eliminar notificación:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_ELIMINAR,
                error: error.message
            });
        }
    }
}

module.exports = new NotificacionController();
