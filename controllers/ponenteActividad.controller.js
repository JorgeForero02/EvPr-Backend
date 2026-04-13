const PonenteActividadService = require('../services/ponenteActividad.service');
const PonenteActividadValidator = require('../validators/ponenteActividad.validator');
const AuditoriaService = require('../services/auditoriaService');
const NotificacionService = require('../services/notificacion.service');
const EmailService = require('../services/emailService');
const { MENSAJES } = require('../constants/ponenteActividad.constants');

class PonenteActividadController {
    async asignarPonente(req, res) {
        const transaction = await PonenteActividadService.crearTransaccion();
        try {
            const { id_ponente, id_actividad, estado, notas } = req.body;
            const usuario = req.usuario;

            // [BACKEND-FIX] B8: Corregido 'admin' → 'administrador'
            if (!['administrador', 'organizador', 'gerente'].includes(usuario.rol)) {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: MENSAJES.SIN_PERMISO_CREAR
                });
            }

            const validacion = await PonenteActividadValidator.validarAsignacion({
                id_ponente,
                id_actividad
            });

            if (!validacion.esValida) {
                await transaction.rollback();
                return res.status(validacion.codigoEstado || 400).json({
                    success: false,
                    message: validacion.mensaje
                });
            }

            const asignacion = await PonenteActividadService.asignar({
                id_ponente,
                id_actividad,
                estado: estado || 'pendiente',
                notas,
                fecha_asignacion: new Date()
            }, transaction);

            await NotificacionService.crearNotificacionAsignacionPonente({
                ponente: validacion.ponente,
                actividad: validacion.actividad,
                evento: validacion.actividad.evento
            }, transaction);

            await AuditoriaService.registrar({
                mensaje: `Ponente ${validacion.ponente.especialidad || validacion.ponente.usuario?.nombre} invitado a actividad ${validacion.actividad.titulo}`,
                tipo: 'POST',
                accion: 'asignar_ponente',
                usuario: { id: usuario.id, nombre: usuario.nombre }
            });

            await transaction.commit();

            try {
                await EmailService.enviarInvitacionPonente(
                    validacion.ponente.usuario.correo,
                    validacion.ponente.usuario.nombre,
                    usuario.nombre,
                    validacion.actividad.titulo,
                    validacion.actividad.evento.titulo
                );
            } catch (emailError) {
                console.error('Error enviando email de invitación a ponente (asignación ya creada):', emailError);
            }

            return res.status(201).json({
                success: true,
                message: MENSAJES.ASIGNADO,
                data: asignacion
            });
        } catch (error) {
            if (transaction && !transaction.finished) { 
                await transaction.rollback();
            }
            console.error('Error al asignar ponente:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_CREAR,
                error: error.message
            });
        }
    }

    async obtenerPonentesDisponibles(req, res) {
        try {
            const usuario = req.usuario;

            // [BACKEND-FIX] B8: Corregido 'admin' → 'administrador'
            if (!['administrador', 'organizador', 'gerente'].includes(usuario.rol)) {
                return res.status(403).json({
                    success: false,
                    message: MENSAJES.SIN_PERMISO_VER
                });
            }
            const resultado = await PonenteActividadService.obtenerPonentesDisponibles();

            return res.json({
                success: true,
                message: MENSAJES.LISTA_PONENTES_OBTENIDA,
                total: resultado.ponentes.length,
                data: resultado.ponentes
            });

        } catch (error) {
            console.error('Error al obtener ponentes disponibles:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_OBTENER,
                error: error.message
            });
        }
    }

    async obtenerPorActividad(req, res) {
        try {
            const { actividadId } = req.params;

            const resultado = await PonenteActividadService.obtenerPorActividad(actividadId);

            if (!resultado.exito) {
                return res.status(404).json({
                    success: false,
                    message: resultado.mensaje
                });
            }

            return res.json({
                success: true,
                message: MENSAJES.LISTA_OBTENIDA,
                total: resultado.asignaciones.length,
                data: resultado.asignaciones
            });
        } catch (error) {
            console.error('Error al obtener ponentes de actividad:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_OBTENER,
                error: error.message
            });
        }
    }

    async obtenerPorPonente(req, res) {
        try {
            const { ponenteId } = req.params;
            const { evento_id, fecha_inicio, fecha_fin, estado } = req.query;
            const filtros = {};
            if (evento_id) filtros.evento_id = evento_id;
            if (fecha_inicio) filtros.fecha_inicio = fecha_inicio;
            if (fecha_fin) filtros.fecha_fin = fecha_fin;
            if (estado) filtros.estado = estado;

            const resultado = await PonenteActividadService.obtenerPorPonente(ponenteId, filtros);

            if (!resultado.exito) {
                return res.status(404).json({
                    success: false,
                    message: resultado.mensaje
                });
            }

            return res.json({
                success: true,
                message: MENSAJES.LISTA_OBTENIDA,
                total: resultado.asignaciones.length,
                data: resultado.asignaciones
            });
        } catch (error) {
            console.error('Error al obtener actividades del ponente:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_OBTENER,
                error: error.message
            });
        }
    }

    async obtenerAsignacion(req, res) {
        try {
            const { ponenteId, actividadId } = req.params;

            const asignacion = await PonenteActividadService.buscarPorIds(ponenteId, actividadId);

            if (!asignacion) {
                return res.status(404).json({
                    success: false,
                    message: MENSAJES.NO_ENCONTRADO
                });
            }

            return res.json({
                success: true,
                message: MENSAJES.OBTENIDO,
                data: asignacion
            });
        } catch (error) {
            console.error('Error al obtener asignación:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_OBTENER,
                error: error.message
            });
        }
    }

    async responderInvitacion(req, res) {
        const transaction = await PonenteActividadService.crearTransaccion();
        try {
            const { ponenteId, actividadId } = req.params;
            const { aceptar, motivo_rechazo } = req.body;
            const usuario = req.usuario;

            if (aceptar === undefined || aceptar === null) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Debes indicar si aceptas o rechazas la invitación'
                });
            }

            const asignacion = await PonenteActividadService.buscarPorIds(ponenteId, actividadId, transaction);

            if (!asignacion) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: MENSAJES.NO_ENCONTRADO
                });
            }

            if (asignacion.ponente.id_usuario !== usuario.id) {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: MENSAJES.SOLO_PONENTE_PUEDE_RESPONDER
                });
            }

            if (asignacion.estado !== 'pendiente') {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: `No puedes responder esta invitación. Estado actual: ${asignacion.estado}`
                });
            }

            const nuevoEstado = aceptar ? 'aceptado' : 'rechazado';
            const notas = aceptar
                ? 'Invitación aceptada por el ponente'
                : `Invitación rechazada. Motivo: ${motivo_rechazo || 'No especificado'}`;

            await asignacion.update({
                estado: nuevoEstado,
                fecha_respuesta: new Date(),
                notas
            }, { transaction });

            await NotificacionService.crearNotificacionRespuestaInvitacion({
                asignacion,
                aceptada: aceptar,
                motivo_rechazo,
                id_ponente_usuario: usuario.id
            }, transaction);

            await AuditoriaService.registrar({
                mensaje: `Ponente ${aceptar ? 'aceptó' : 'rechazó'} invitación a actividad ${asignacion.actividad.titulo}`,
                tipo: 'PUT',
                accion: 'responder_invitacion_ponente',
                usuario: { id: usuario.id, nombre: usuario.nombre }
            });

            await transaction.commit();

            try {
                const responsables = await NotificacionService.obtenerResponsablesEvento(asignacion.actividad.id_evento);

                for (const responsable of responsables) {
                    await EmailService.enviarNotificacionRespuestaPonente(
                        responsable.correo,
                        responsable.nombre,
                        usuario.nombre, 
                        asignacion.actividad.titulo,
                        nuevoEstado 
                    );
                }
            } catch (emailError) {
                console.error('Error enviando emails de respuesta de ponente (respuesta ya registrada):', emailError);
            }

            return res.json({
                success: true,
                message: aceptar ? MENSAJES.INVITACION_ACEPTADA : MENSAJES.INVITACION_RECHAZADA,
                data: asignacion
            });
        } catch (error) {
            if(transaction && !transaction.finished) {
            await transaction.rollback();
            }
            console.error('Error al responder invitación:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al procesar respuesta',
                error: error.message
            });
        }
    }

    async solicitarCambio(req, res) {
        const transaction = await PonenteActividadService.crearTransaccion();
        try {
            const { ponenteId, actividadId } = req.params;
            const { cambios_solicitados, justificacion } = req.body;
            const usuario = req.usuario;

            const asignacion = await PonenteActividadService.buscarPorIds(ponenteId, actividadId, transaction);

            if (!asignacion) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: MENSAJES.NO_ENCONTRADO
                });
            }

            // [BACKEND-FIX] B8: Corregido 'admin' → 'administrador'
            if (asignacion.ponente.id_usuario !== usuario.id && !['administrador', 'organizador', 'gerente'].includes(usuario.rol)) {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: MENSAJES.SIN_PERMISO_MODIFICAR
                });
            }

            const validacion = PonenteActividadValidator.validarSolicitudCambio({
                cambios_solicitados,
                justificacion
            });

            if (!validacion.esValida) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: validacion.mensaje
                });
            }

            const asignacionActualizada = await PonenteActividadService.solicitarCambio({
                id_ponente: ponenteId,
                id_actividad: actividadId,
                cambios_solicitados,
                justificacion,
                id_usuario_ponente: usuario.id
            }, transaction);

            await AuditoriaService.registrar({
                mensaje: `Solicitud de cambio enviada para actividad ${asignacion.actividad.titulo}`,
                tipo: 'POST',
                accion: 'solicitar_cambio_actividad',
                usuario: { id: usuario.id, nombre: usuario.nombre }
            });

            await transaction.commit();

            return res.json({
                success: true,
                message: MENSAJES.SOLICITUD_ENVIADA,
                data: asignacionActualizada
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error al solicitar cambio:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_SOLICITUD,
                error: error.message
            });
        }
    }

    async procesarSolicitud(req, res) {
        const transaction = await PonenteActividadService.crearTransaccion();
        try {
            const { ponenteId, actividadId } = req.params;
            const { aprobada, comentarios } = req.body;
            const usuario = req.usuario;

            // [BACKEND-FIX] B8: Corregido 'admin' → 'administrador'
            if (!['administrador', 'organizador', 'gerente'].includes(usuario.rol)) {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: MENSAJES.SIN_PERMISO_MODIFICAR
                });
            }

            const asignacion = await PonenteActividadService.procesarSolicitud({
                id_ponente: ponenteId,
                id_actividad: actividadId,
                aprobada,
                comentarios,
                id_usuario_admin: usuario.id
            }, transaction);

            await AuditoriaService.registrar({
                mensaje: `Solicitud de cambio ${aprobada ? 'aprobada' : 'rechazada'} para actividad`,
                tipo: 'PUT',
                accion: 'procesar_solicitud_cambio',
                usuario: { id: usuario.id, nombre: usuario.nombre }
            });

            await transaction.commit();

            return res.json({
                success: true,
                message: MENSAJES.SOLICITUD_PROCESADA,
                data: asignacion
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error al procesar solicitud:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_SOLICITUD,
                error: error.message
            });
        }
    }

    async actualizarAsignacion(req, res) {
        const transaction = await PonenteActividadService.crearTransaccion();
        try {
            const { ponenteId, actividadId } = req.params;
            const { estado, notas } = req.body;
            const usuario = req.usuario;

            // [BACKEND-FIX] B8: Corregido 'admin' → 'administrador'
            if (!['administrador', 'organizador', 'gerente'].includes(usuario.rol)) {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: MENSAJES.SIN_PERMISO_MODIFICAR
                });
            }

            const asignacion = await PonenteActividadService.buscarPorIds(ponenteId, actividadId, transaction);

            if (!asignacion) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: MENSAJES.NO_ENCONTRADO
                });
            }

            if (estado) {
                const validacionEstado = PonenteActividadValidator.validarEstado(estado);
                if (!validacionEstado.esValida) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: validacionEstado.mensaje
                    });
                }
            }

            const actualizaciones = PonenteActividadService.construirActualizaciones({ estado, notas });
            await asignacion.update(actualizaciones, { transaction });

            await AuditoriaService.registrar({
                mensaje: `Asignación actualizada para ponente-actividad`,
                tipo: 'PUT',
                accion: 'actualizar_ponente_actividad',
                usuario: { id: usuario.id, nombre: usuario.nombre }
            });

            await transaction.commit();

            return res.json({
                success: true,
                message: MENSAJES.ACTUALIZADO,
                data: asignacion
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error al actualizar asignación:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_ACTUALIZAR,
                error: error.message
            });
        }
    }

    async eliminarAsignacion(req, res) {
        const transaction = await PonenteActividadService.crearTransaccion();
        try {
            const { ponenteId, actividadId } = req.params;
            const usuario = req.usuario; 

            // [BACKEND-FIX] B8: Corregido 'admin' → 'administrador'
            if (!['administrador', 'organizador', 'gerente'].includes(usuario.rol)) {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: MENSAJES.SIN_PERMISO_ELIMINAR
                });
            }

            const asignacion = await PonenteActividadService.buscarPorIds(ponenteId, actividadId, transaction);

            if (!asignacion) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: MENSAJES.NO_ENCONTRADO
                });
            }

            const datosEmail = {
                destinatario: asignacion.ponente.usuario.correo,
                nombrePonente: asignacion.ponente.usuario.nombre,
                nombreActividad: asignacion.actividad.titulo,
                nombreEvento: asignacion.actividad.evento.titulo,
                nombreOrganizador: usuario.nombre
            };

            await asignacion.destroy({ transaction });

            await AuditoriaService.registrar({
                mensaje: `Ponente removido de actividad`,
                tipo: 'DELETE',
                accion: 'eliminar_ponente_actividad',
                usuario: { id: usuario.id, nombre: usuario.nombre }
            });

            await transaction.commit();

            try {
                await EmailService.enviarNotificacionPonenteRemovido(
                    datosEmail.destinatario,
                    datosEmail.nombrePonente,
                    datosEmail.nombreActividad,
                    datosEmail.nombreEvento,
                    datosEmail.nombreOrganizador
                );
            } catch (emailError) {
                console.error('Error enviando email de ponente removido (asignación ya eliminada):', emailError);
            }

            return res.json({
                success: true,
                message: MENSAJES.ELIMINADO
            });
        } catch (error) {
            if (transaction && !transaction.finished) {
                await transaction.rollback();
            }
            console.error('Error al eliminar asignación:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_ELIMINAR,
                error: error.message
            });
        }
    }
}

module.exports = new PonenteActividadController();
