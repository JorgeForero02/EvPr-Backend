const ActividadService = require('../services/actividad.service');
const ActividadValidator = require('../validators/actividad.validator');
const PermisosService = require('../services/permisos.service');
const AuditoriaService = require('../services/auditoriaService');
const notificacionService = require('../services/notificacion.service');
const EmailService = require('../services/emailService');
const { Inscripcion, Asistente, PonenteActividad, Ponente, Usuario } = require('../models');
const { Op } = require('sequelize');
const { CODIGOS_HTTP, MENSAJES_RESPUESTA } = require('../constants/actividad.constants');

class ActividadController {

    async crearActividad(req, res) {
        const transaction = await ActividadService.crearTransaccion();
        try {
            const { eventoId } = req.params;
            const datosActividad = req.body;
            const evento = req.evento;
            const usuario = req.usuario;

            const errorValidacion = ActividadValidator.validarCreacion(datosActividad, evento);
            if (errorValidacion) {
                await transaction.rollback();
                return res.status(CODIGOS_HTTP.BAD_REQUEST).json({
                    success: false,
                    message: errorValidacion
                });
            }

            const errorSolapamiento = await ActividadValidator.validarSolapamiento(
                null,
                eventoId,
                datosActividad.fecha_actividad,
                datosActividad.hora_inicio,
                datosActividad.hora_fin,
                datosActividad.lugares || [],
                datosActividad.ponentes || []
            );

            if (errorSolapamiento) {
                await transaction.rollback();
                return res.status(CODIGOS_HTTP.CONFLICT).json({
                    success: false,
                    message: errorSolapamiento.mensaje,
                    conflicto: errorSolapamiento.actividadConflicto || null
                });
            }

            // RF33 — Validar capacidad de sala vs inscritos confirmados del evento
            const errorCapacidad = await ActividadValidator.validarCapacidadSala(
                datosActividad.lugares || [],
                eventoId
            );
            if (errorCapacidad) {
                await transaction.rollback();
                return res.status(CODIGOS_HTTP.BAD_REQUEST).json({
                    success: false,
                    message: errorCapacidad
                });
            }

            const actividad = await ActividadService.crear(
                eventoId,
                datosActividad,
                evento,
                transaction
            );

            await transaction.commit();

            try {
                await AuditoriaService.registrar({
                    mensaje: `Se creó la actividad: ${actividad.titulo}`,
                    tipo: 'POST',
                    accion: 'crear_actividad',
                    usuario: { id: usuario.id, nombre: usuario.nombre }
                });
            } catch (auditError) {
                console.error('Error al registrar auditoría:', auditError);
            }

            return res.status(CODIGOS_HTTP.CREADO).json({
                success: true,
                message: MENSAJES_RESPUESTA.ACTIVIDAD_CREADA,
                data: actividad
            });

        } catch (error) {
            if (transaction.finished !== 'commit') {
                await transaction.rollback();
            }
            console.error('Error al crear actividad:', error);
            return res.status(CODIGOS_HTTP.ERROR_INTERNO).json({
                success: false,
                message: MENSAJES_RESPUESTA.ERROR_CREAR
            });
        }
    }

    async obtenerActividadesPorEvento(req, res) {
        try {
            const { eventoId } = req.params;
            const actividades = await ActividadService.buscarTodasPorEvento(eventoId);

            return res.status(CODIGOS_HTTP.OK).json({
                success: true,
                data: actividades
            });

        } catch (error) {
            console.error('Error al obtener actividades:', error);
            return res.status(CODIGOS_HTTP.ERROR_INTERNO).json({
                success: false,
                message: MENSAJES_RESPUESTA.ERROR_OBTENER
            });
        }
    }

    async obtenerActividadPorId(req, res) {
        try {

            const { actividadId } = req.params;
            const actividad = await ActividadService.buscarPorId(actividadId);
            
            return res.status(CODIGOS_HTTP.OK).json({
                success: true,
                data: actividad
            });

        } catch (error) {
            console.error('Error al obtener actividad:', error);
            return res.status(CODIGOS_HTTP.ERROR_INTERNO).json({
                success: false,
                message: MENSAJES_RESPUESTA.ERROR_OBTENER
            });
        }
    }

    async obtenerLugaresDeActividad(req, res) {
        try {
            const { actividadId } = req.params;
            const lugares = await ActividadService.obtenerLugaresPorActividad(actividadId);
            return res.status(CODIGOS_HTTP.OK).json({ success: true, data: lugares });
        } catch (error) {
            console.error('Error al obtener lugares de actividad:', error);
            return res.status(CODIGOS_HTTP.ERROR_INTERNO).json({
                success: false,
                message: MENSAJES_RESPUESTA.ERROR_OBTENER
            });
        }
    }

    async actualizarActividad(req, res) {
        const transaction = await ActividadService.crearTransaccion();
        try {
            const { actividadId } = req.params;
            
            const actividadAnt = await ActividadService.buscarPorId(actividadId);
            
            const datosActualizacion = req.body;
            const actividad = req.actividad;

            const evento = await ActividadService.buscarEventoPorId(actividadAnt.id_evento);

            if (!evento) {
                await transaction.rollback();
                return res.status(CODIGOS_HTTP.NOT_FOUND).json({
                    success: false,
                    message: 'Evento no encontrado'
                });
            }

            const errorValidacion = ActividadValidator.validarActualizacion(
                datosActualizacion,
                actividadAnt,
                evento
            );

            if (errorValidacion) {
                await transaction.rollback();
                return res.status(CODIGOS_HTTP.BAD_REQUEST).json({
                    success: false,
                    message: errorValidacion
                });
            }

            const errorSolapamiento = await ActividadValidator.validarSolapamiento(
                actividadId,
                actividadAnt.id_evento, 
                datosActualizacion.fecha_actividad || actividadAnt.fecha_actividad,
                datosActualizacion.hora_inicio || actividadAnt.hora_inicio,
                datosActualizacion.hora_fin || actividadAnt.hora_fin,
                datosActualizacion.lugares || [],
                datosActualizacion.ponentes || []
            );

            if (errorSolapamiento) {
                await transaction.rollback();
                return res.status(CODIGOS_HTTP.CONFLICT).json({
                    success: false,
                    message: errorSolapamiento.mensaje,
                    conflicto: errorSolapamiento.actividadConflicto || null
                });
            }

            // RF33 — Validar capacidad de sala vs inscritos confirmados del evento
            const errorCapacidad = await ActividadValidator.validarCapacidadSala(
                datosActualizacion.lugares || [],
                actividadAnt.id_evento
            );
            if (errorCapacidad) {
                await transaction.rollback();
                return res.status(CODIGOS_HTTP.BAD_REQUEST).json({
                    success: false,
                    message: errorCapacidad
                });
            }

            const actividadActualizada = await ActividadService.actualizar(
                actividadId,
                datosActualizacion,
                evento,
                transaction
            );

            try {
                const [inscripciones, ponentesActividad] = await Promise.all([
                    Inscripcion.findAll({
                        where: { id_evento: actividadAnt.id_evento, estado: { [Op.in]: ['Confirmada', 'Pendiente'] } },
                        include: [{ model: Asistente, as: 'asistente', include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'correo'] }] }]
                    }),
                    PonenteActividad.findAll({
                        where: { id_actividad: actividadId, estado: 'aceptado' },
                        include: [{ model: Ponente, as: 'ponente', include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'correo'] }] }]
                    })
                ]);

                const participantes = inscripciones.map(i => i.asistente.usuario.toJSON());
                const ponentes = ponentesActividad.map(pa => ({ ...pa.ponente.toJSON(), id_usuario: pa.ponente.usuario.id }));

                await notificacionService.crearNotificacionActualizacionActividad({
                    actividad: actividadActualizada.toJSON(),
                    evento: evento.toJSON(),
                    ponentes,
                    participantes
                }, transaction);

                const todosDestinatarios = [
                    ...participantes,
                    ...ponentes.map(p => p.usuario || { nombre: p.nombre, correo: p.correo })
                ];
                for (const dest of todosDestinatarios) {
                    if (dest.correo) {
                        EmailService.enviarNotificacionCambioAgenda(
                            dest.correo,
                            dest.nombre,
                            evento.titulo,
                            actividadActualizada.titulo
                        );
                    }
                }
            } catch (notifError) {
                console.error('Error al crear notificaciones de actualización de actividad:', notifError);
            }

            await transaction.commit();

            try {
                await AuditoriaService.registrar({
                    mensaje: `Se actualizó la actividad: ${actividadAnt.titulo}`,
                    tipo: 'PUT',
                    accion: 'actualizar_actividad',
                    usuario: { id: req.usuario.id, nombre: req.usuario.nombre }
                });
            } catch (auditError) {
                console.error('Error al registrar auditoría:', auditError);
            }

            return res.status(CODIGOS_HTTP.OK).json({
                success: true,
                message: MENSAJES_RESPUESTA.ACTIVIDAD_ACTUALIZADA,
                data: actividadActualizada
            });

        } catch (error) {
            if (transaction.finished !== 'commit') {
                await transaction.rollback();
            }
            console.error('Error al actualizar actividad:', error);
            return res.status(CODIGOS_HTTP.ERROR_INTERNO).json({
                success: false,
                message: MENSAJES_RESPUESTA.ERROR_ACTUALIZAR
            });
        }
    }


    async eliminarActividad(req, res) {
        const transaction = await ActividadService.crearTransaccion();
        try {
            const { actividadId } = req.params;
            const actividad = req.actividad;

            await ActividadService.eliminar(actividadId, transaction);

            await transaction.commit();

            try {
                await AuditoriaService.registrar({
                    mensaje: `Se eliminó la actividad: ${actividad.titulo}`,
                    tipo: 'DELETE',
                    accion: 'eliminar_actividad',
                    usuario: { id: req.usuario.id, nombre: req.usuario.nombre }
                });
            } catch (auditError) {
                console.error('Error al registrar auditoría:', auditError);
            }

            return res.status(CODIGOS_HTTP.OK).json({
                success: true,
                message: MENSAJES_RESPUESTA.ACTIVIDAD_ELIMINADA
            });

        } catch (error) {
            if (transaction.finished !== 'commit') {
                await transaction.rollback();
            }
            console.error('Error al eliminar actividad:', error);
            const codigoEstado = error.codigoEstado || CODIGOS_HTTP.ERROR_INTERNO;
            return res.status(codigoEstado).json({
                success: false,
                message: codigoEstado === CODIGOS_HTTP.ERROR_INTERNO
                    ? MENSAJES_RESPUESTA.ERROR_ELIMINAR
                    : error.message
            });
        }
    }
}

module.exports = new ActividadController();
