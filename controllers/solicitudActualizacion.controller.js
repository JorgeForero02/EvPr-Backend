const SolicitudActualizacionService = require('../services/solicitudActualizacion.service');
const AuditoriaService = require('../services/auditoriaService');
const EmailService = require('../services/emailService');
const NotificacionService = require('../services/notificacion.service');
const ApiResponse = require('../utils/response');

class SolicitudActualizacionController {
    async crear(req, res, next) {
        try {
            const { id_empresa } = req.params;
            const { datos_propuestos, justificacion } = req.body;
            const usuario = req.usuario;

            const resultado = await SolicitudActualizacionService.crear({
                id_empresa: parseInt(id_empresa),
                id_solicitante: usuario.id,
                datos_propuestos,
                justificacion
            });

            if (!resultado.exito) {
                return ApiResponse.error(res, resultado.mensaje, resultado.codigoEstado || 400);
            }

            await AuditoriaService.registrar({
                mensaje: `Solicitud de actualización de empresa ID ${id_empresa} creada`,
                tipo: 'POST',
                accion: 'crear_solicitud_actualizacion_empresa',
                usuario,
                entidad: 'empresa',
                ip: req.ip
            });

            return ApiResponse.success(res, resultado.solicitud, 'Solicitud de actualización enviada. Quedará pendiente hasta que el administrador la revise.', 201);
        } catch (error) {
            next(error);
        }
    }

    async obtenerPorEmpresa(req, res, next) {
        try {
            const { id_empresa } = req.params;
            const solicitudes = await SolicitudActualizacionService.obtenerPorEmpresa(parseInt(id_empresa));
            return ApiResponse.success(res, solicitudes, 'Historial de solicitudes obtenido');
        } catch (error) {
            next(error);
        }
    }

    async obtenerTodas(req, res, next) {
        try {
            const { estado } = req.query;
            const solicitudes = await SolicitudActualizacionService.obtenerTodas(estado);
            return ApiResponse.success(res, solicitudes, 'Solicitudes de actualización obtenidas');
        } catch (error) {
            next(error);
        }
    }

    async obtenerPorId(req, res, next) {
        try {
            const { id } = req.params;
            const solicitud = await SolicitudActualizacionService.buscarPorId(parseInt(id));
            if (!solicitud) {
                return ApiResponse.notFound(res, 'Solicitud no encontrada');
            }
            return ApiResponse.success(res, solicitud, 'Solicitud obtenida');
        } catch (error) {
            next(error);
        }
    }

    async procesar(req, res, next) {
        try {
            const { id } = req.params;
            const { aprobar, motivo_rechazo } = req.body;
            const usuario = req.usuario;

            if (aprobar === undefined || aprobar === null) {
                return ApiResponse.error(res, 'Debe indicar si aprueba o rechaza la solicitud', 400);
            }

            const aprobado = aprobar === true || aprobar === 'true';

            const resultado = await SolicitudActualizacionService.procesar({
                id: parseInt(id),
                aprobar: aprobado,
                motivo_rechazo,
                id_admin: usuario.id
            });

            if (!resultado.exito) {
                return ApiResponse.error(res, resultado.mensaje, resultado.codigoEstado || 400);
            }

            await AuditoriaService.registrar({
                mensaje: `Solicitud de actualización de empresa ID ${resultado.solicitud.id_empresa} ${aprobado ? 'aprobada' : 'rechazada'}`,
                tipo: 'PUT',
                accion: aprobado ? 'aprobar_solicitud_actualizacion' : 'rechazar_solicitud_actualizacion',
                usuario,
                entidad: 'empresa',
                ip: req.ip
            });

            try {
                const solicitante = resultado.solicitud.solicitante;
                const empresa = resultado.solicitud.empresa;
                if (solicitante && empresa) {
                    if (aprobado) {
                        await EmailService.enviarEmpresaAprobada(
                            solicitante.correo,
                            solicitante.nombre,
                            empresa.nombre
                        );
                    } else {
                        await EmailService.enviarEmpresaRechazada(
                            solicitante.correo,
                            solicitante.nombre,
                            empresa.nombre,
                            motivo_rechazo || 'No se especificó motivo'
                        );
                    }
                    await NotificacionService.crearNotificacionRespuestaEmpresa(
                        solicitante,
                        empresa,
                        aprobado,
                        motivo_rechazo
                    );
                }
            } catch (notifError) {
                console.error('Error al enviar notificación de solicitud:', notifError);
            }

            return ApiResponse.success(res, resultado.solicitud, aprobado ? 'Solicitud aprobada y datos actualizados' : 'Solicitud rechazada');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SolicitudActualizacionController();
