const EventoService = require('../services/evento.service');
const EventoValidator = require('../validators/evento.validator');
const PermisosService = require('../services/permisos.service');
const AuditoriaService = require('../services/auditoriaService');
const EmailService = require('../services/emailService');
const NotificacionService = require('../services/notificacion.service');
const { MENSAJES, ESTADOS } = require('../constants/evento.constants');

class EventoController {
    async crearEvento(req, res) {
        const transaction = await EventoService.crearTransaccion();

        try {
            const usuario = req.usuario;
            const empresaId = req.body.id_empresa || req.adminEmpresa?.id_empresa;

            const validacion = await EventoValidator.validarCreacion(req.body, empresaId);

            if (!validacion.esValida) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: validacion.mensaje
                });
            }

            const errSala = await EventoValidator.validarDisponibilidadSala(
                req.body.lugar_id, req.body.fecha_inicio, req.body.fecha_fin
            );
            if (errSala) {
                await transaction.rollback();
                return res.status(409).json({ success: false, message: errSala.mensaje });
            }

            const errCapacidad = await EventoValidator.validarCapacidadEvento(
                req.body.lugar_id, req.body.cupos
            );
            if (errCapacidad) {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: errCapacidad.mensaje });
            }

            const resultado = await EventoService.crear({
                ...req.body,
                id_empresa: empresaId,
                id_creador: usuario.id
            }, transaction);

            await AuditoriaService.registrar({
                mensaje: `Se creó el evento: ${resultado.evento.titulo}`,
                tipo: 'POST',
                accion: 'crear_evento',
                usuario: { id: usuario.id, nombre: usuario.nombre }
            });

            await transaction.commit();

            return res.status(201).json({
                success: true,
                message: MENSAJES.CREADO,
                data: {
                    id: resultado.evento.id,
                    titulo: resultado.evento.titulo,
                    modalidad: resultado.evento.modalidad,
                    estado: resultado.evento.estado,
                    fecha_inicio: resultado.evento.fecha_inicio,
                    fecha_fin: resultado.evento.fecha_fin,
                    id_empresa: resultado.evento.id_empresa,
                    id_creador: resultado.evento.id_creador
                }
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error al crear evento:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_CREAR,
                error: error.message
            });
        }
    }

    async obtenerEventos(req, res) {
        try {
            const { id_empresa, estado, modalidad } = req.query;
            const usuario = req.usuario;

            const whereClause = EventoService.construirFiltros({
                id_empresa,
                estado,
                modalidad,
                rol: usuario.rol,
                empresaUsuario: usuario.rolData?.id_empresa
            });

            const eventos = await EventoService.obtenerTodos(whereClause);

            return res.json({
                success: true,
                message: MENSAJES.LISTA_OBTENIDA,
                total: eventos.length,
                data: eventos
            });
        } catch (error) {
            console.error('Error al obtener eventos:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_OBTENER,
                error: error.message
            });
        }
    }

    async obtenerEventoById(req, res) {
        try {
            const { eventoId } = req.params;
            const usuario = req.usuario;

            const whereClause = EventoService.construirFiltros({
                id: eventoId,
                rol: usuario.rol,
                empresaUsuario: usuario.rolData?.id_empresa
            });

            const evento = await EventoService.buscarUno(whereClause);

            if (!evento) {
                return res.status(404).json({
                    success: false,
                    message: MENSAJES.NO_ENCONTRADO_O_SIN_PERMISO
                });
            }

            return res.json({
                success: true,
                message: MENSAJES.OBTENIDO,
                data: evento
            });
        } catch (error) {
            console.error('Error al obtener evento:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_OBTENER,
                error: error.message
            });
        }
    }

    async actualizarEvento(req, res) {
        const transaction = await EventoService.crearTransaccion();

        try {
            const eventoActualizado = req.evento;

            // [BACKEND-FIX] B13: Pasar evento actual para validación cruzada de fechas
            const errorValidacion = EventoValidator.validarActualizacion(req.body, eventoActualizado);

            if (errorValidacion) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: errorValidacion
                });
            }

            // [BACKEND-FIX] B5: Validar estado antes de permitir actualización
            const nuevoEstado = req.body.estado !== undefined ? Number(req.body.estado) : undefined;
            const errorEstado = EventoValidator.validarEstado(eventoActualizado.estado, nuevoEstado);
            if (errorEstado) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: errorEstado
                });
            }

            const validacionAgenda = await EventoValidator.validarAgenda(eventoActualizado.id);
            
            if (!validacionAgenda.esValida) {
                await transaction.rollback();
                return res.status(409).json({
                    success: false,
                    message: validacionAgenda.mensaje
                });
            }

            const lugarIdActualizado = req.body.lugar_id !== undefined ? req.body.lugar_id : eventoActualizado.lugar_id;
            const fechaInicioEfectiva = req.body.fecha_inicio || eventoActualizado.fecha_inicio;
            const fechaFinEfectiva = req.body.fecha_fin || eventoActualizado.fecha_fin;

            const errSalaUpd = await EventoValidator.validarDisponibilidadSala(
                lugarIdActualizado, fechaInicioEfectiva, fechaFinEfectiva, eventoActualizado.id
            );
            if (errSalaUpd) {
                await transaction.rollback();
                return res.status(409).json({ success: false, message: errSalaUpd.mensaje });
            }

            const cuposEfectivos = req.body.cupos !== undefined ? req.body.cupos : eventoActualizado.cupos;
            const errCapacidadUpd = await EventoValidator.validarCapacidadEvento(
                lugarIdActualizado, cuposEfectivos
            );
            if (errCapacidadUpd) {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: errCapacidadUpd.mensaje });
            }

            const actualizaciones = EventoService.construirActualizaciones(req.body);

            await eventoActualizado.update(actualizaciones, { transaction });

            await AuditoriaService.registrar({
                mensaje: `Se actualizó el evento: ${eventoActualizado.titulo}`,
                tipo: 'PUT',
                accion: 'actualizar_evento',
                usuario: { id: req.usuario.id, nombre: req.usuario.nombre }
            });

            await transaction.commit();

            return res.json({
                success: true,
                message: MENSAJES.ACTUALIZADO,
                data: eventoActualizado
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error al actualizar evento:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_ACTUALIZAR,
                error: error.message
            });
        }
    }

    // RF80 — Reporte de evento
    async obtenerReporte(req, res) {
        try {
            const { eventoId } = req.params;
            const reporte = await EventoService.obtenerReporte(eventoId);
            if (!reporte) {
                return res.status(404).json({ success: false, message: MENSAJES.NO_ENCONTRADO_O_SIN_PERMISO });
            }
            return res.json({ success: true, data: reporte });
        } catch (error) {
            console.error('Error al obtener reporte:', error);
            return res.status(500).json({ success: false, message: MENSAJES.ERROR_OBTENER });
        }
    }

    // Grupo F — Mensaje manual del Organizador Líder a todos los inscritos
    async enviarNotificacionManual(req, res) {
        try {
            const { eventoId } = req.params;
            const { asunto, mensaje } = req.body;
            const usuario = req.usuario;

            if (!asunto || !mensaje) {
                return res.status(400).json({
                    success: false,
                    message: 'asunto y mensaje son requeridos'
                });
            }

            const evento = req.evento || await EventoService.obtenerEventoById(eventoId);
            if (!evento) {
                return res.status(404).json({ success: false, message: MENSAJES.NO_ENCONTRADO_O_SIN_PERMISO });
            }

            const inscritos = await EventoService.obtenerInscritosConfirmados(eventoId);

            if (inscritos.length === 0) {
                return res.json({
                    success: true,
                    message: 'No hay inscritos activos para notificar',
                    data: { total_destinatarios: 0, emails_enviados: 0 }
                });
            }

            await NotificacionService.crearNotificacionMensajeManual({
                evento,
                destinatarios: inscritos,
                asunto,
                mensaje
            });

            const resultadosEmail = await Promise.allSettled(
                inscritos.map(u =>
                    EmailService.enviarMensajePersonalizado(u.correo, u.nombre, evento.titulo, asunto, mensaje)
                )
            );

            const emailsEnviados = resultadosEmail.filter(r => r.status === 'fulfilled').length;
            const emailsFallidos = resultadosEmail.length - emailsEnviados;

            await AuditoriaService.registrar({
                mensaje: `Organizador envió mensaje manual a ${inscritos.length} inscritos del evento "${evento.titulo}". Asunto: ${asunto}`,
                tipo: 'POST',
                accion: 'notificacion_manual_organizador',
                usuario: { id: usuario.id, nombre: usuario.nombre }
            });

            return res.json({
                success: true,
                message: 'Mensaje enviado a los inscritos',
                data: {
                    total_destinatarios: inscritos.length,
                    emails_enviados: emailsEnviados,
                    emails_fallidos: emailsFallidos
                }
            });
        } catch (error) {
            console.error('Error al enviar notificación manual:', error);
            return res.status(500).json({ success: false, message: MENSAJES.ERROR_OBTENER });
        }
    }

    // RF80 — Exportar reporte de evento como CSV
    async exportarReporteCSV(req, res) {
        try {
            const { eventoId } = req.params;
            const reporte = await EventoService.obtenerReporte(eventoId);

            if (!reporte) {
                return res.status(404).json({ success: false, message: MENSAJES.NO_ENCONTRADO_O_SIN_PERMISO });
            }

            const escapar = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

            const filas = [
                ['ID Evento', 'Título', 'Total Inscritos', 'Total Asistencias', 'Tasa Asistencia (%)',
                    'Encuestas Enviadas', 'Encuestas Respondidas', 'Tasa Respuesta (%)'].join(','),
                [
                    reporte.id_evento,
                    escapar(reporte.titulo),
                    reporte.total_inscritos,
                    reporte.total_asistencias,
                    reporte.tasa_asistencia,
                    reporte.encuestas_enviadas,
                    reporte.encuestas_respondidas,
                    reporte.tasa_respuesta
                ].join(',')
            ];

            const nombreEvento = reporte.titulo?.replace(/[^a-zA-Z0-9]/g, '_') ?? 'evento';
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="reporte_${nombreEvento}.csv"`);
            return res.send('\uFEFF' + filas.join('\n'));
        } catch (error) {
            console.error('Error al exportar reporte de evento CSV:', error);
            return res.status(500).json({ success: false, message: MENSAJES.ERROR_OBTENER });
        }
    }

    // RF81 — Presupuesto total del evento
    async obtenerPresupuesto(req, res) {
        try {
            const { eventoId } = req.params;
            const presupuesto = await EventoService.obtenerPresupuestoTotal(eventoId);
            if (!presupuesto) {
                return res.status(404).json({ success: false, message: MENSAJES.NO_ENCONTRADO_O_SIN_PERMISO });
            }
            return res.json({ success: true, data: presupuesto });
        } catch (error) {
            console.error('Error al obtener presupuesto:', error);
            return res.status(500).json({ success: false, message: MENSAJES.ERROR_OBTENER });
        }
    }

    async eliminarEvento(req, res) {
        const transaction = await EventoService.crearTransaccion();
        try {
            const eventoActualizado = req.evento;

            await eventoActualizado.update(
                { estado: ESTADOS.CANCELADO, fecha_actualizacion: new Date() },
                { transaction }
            );

            await AuditoriaService.registrar({
                mensaje: `Se canceló el evento: ${eventoActualizado.titulo}`,
                tipo: 'DELETE',
                accion: 'cancelar_evento',
                usuario: { id: req.usuario.id, nombre: req.usuario.nombre }
            });

            transaction.afterCommit(async () => {
                try {
                    const { participantes, creador } = await EventoService.obtenerNotificacionesCancelacion(eventoActualizado);
                    const correoDelCreador = creador ? creador.correo : null;

                    for (const usuario of participantes) {
                        await EmailService.enviarNotificacionCancelacion(
                            usuario.correo,
                            usuario.nombre,
                            eventoActualizado.titulo,
                            correoDelCreador
                        );
                    }

                    if (creador) {
                        await EmailService.enviarConfirmacionCancelacionCreador(
                            creador.correo,
                            creador.nombre,
                            eventoActualizado.titulo
                        );
                    }

                    await NotificacionService.crearNotificacionEventoCancelado(
                        eventoActualizado,
                        participantes,
                        creador
                    );
                } catch (notificationError) {
                    console.error('Error al enviar notificaciones de cancelación:', notificationError);
                }
            });

            await transaction.commit();

            return res.json({
                success: true,
                message: MENSAJES.CANCELADO
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error al eliminar evento:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_CANCELAR,
                error: error.message
            });
        }
    }
}

module.exports = new EventoController();
