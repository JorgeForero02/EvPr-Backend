const {
    Notificacion, TipoNotificacion, Usuario, Evento, Administrador, AdministradorEmpresa } = require('../models');
const { MENSAJES, TIPOS_ENTIDAD, ESTADOS_NOTIFICACION } = require('../constants/notificacion.constants');
const { Op } = require('sequelize');

class NotificacionService {
    crearTransaccion() {
        return Notificacion.sequelize.transaction();
    }

    async crear(datosNotificacion, transaction) {
        const notificacion = await Notificacion.create(datosNotificacion, { transaction });
        return notificacion;
    }

    async _obtenerAdministradoresSistema(limit = 5) {
        try {
            const adminsData = await Administrador.findAll({ attributes: ['id_usuario'], limit });
            const idsAdmins = adminsData.map(a => a.id_usuario);

            if (idsAdmins.length === 0) return [];

            return await Usuario.findAll({
                where: { id: { [Op.in]: idsAdmins } },
                attributes: ['id', 'nombre', 'correo'],
            });
        } catch (error) {
            console.error("Error al obtener administradores del sistema:", error);
            return [];
        }
    }

    async crearNotificacionActualizacionActividad({ actividad, evento, ponentes, participantes }, transaction = null) {
        try {
            const tipoNotificacion = await TipoNotificacion.findOne({
                where: { nombre: 'actualizacion_actividad' }
            });

            const notificaciones = [];
            const tipoId = tipoNotificacion?.id || 1;
            const nombreEvento = evento.titulo;
            const nombreActividad = actividad.titulo;

            for (const ponente of (ponentes || [])) {
                const notif = await this.crear({
                    id_TipoNotificacion: tipoId,
                    titulo: `Actualización en Actividad: ${nombreActividad}`,
                    contenido: `La actividad "${nombreActividad}" del evento "${nombreEvento}" en la que estás asignado ha sido actualizada.`,
                    entidad_tipo: TIPOS_ENTIDAD.ACTIVIDAD,
                    entidad_id: actividad.id_actividad,
                    id_destinatario: ponente.id_usuario,
                    id_evento: evento.id,
                    datos_adicionales: {
                        id_actividad: actividad.id_actividad,
                        nombre_actividad: nombreActividad,
                        id_evento: evento.id,
                        nombre_evento: nombreEvento
                    }
                }, transaction);
                notificaciones.push(notif);
            }

            for (const usuario of (participantes || [])) {
                const notif = await this.crear({
                    id_TipoNotificacion: tipoId,
                    titulo: `Cambio en agenda del evento: ${nombreEvento}`,
                    contenido: `La actividad "${nombreActividad}" del evento "${nombreEvento}" en el que estás inscrito ha sido modificada.`,
                    entidad_tipo: TIPOS_ENTIDAD.ACTIVIDAD,
                    entidad_id: actividad.id_actividad,
                    id_destinatario: usuario.id,
                    id_evento: evento.id,
                    datos_adicionales: {
                        id_actividad: actividad.id_actividad,
                        nombre_actividad: nombreActividad,
                        id_evento: evento.id,
                        nombre_evento: nombreEvento
                    }
                }, transaction);
                notificaciones.push(notif);
            }

            return notificaciones;
        } catch (error) {
            console.error('Error al crear notificaciones de actualización de actividad:', error);
            return [];
        }
    }

    async obtenerResponsablesEvento(eventoId) {
        const evento = await Evento.findByPk(eventoId, {
            include: [
                {
                    model: Usuario,
                    as: 'creador',
                    attributes: ['id', 'nombre', 'correo']
                }
            ]
        });

        if (!evento) {
            return [];
        }

        const responsables = [];

        if (evento.creador) {
            responsables.push(evento.creador);
        }

        const responsablesUnicos = responsables.reduce((acc, usuario) => {
            if (!acc.find(u => u.id === usuario.id)) {
                acc.push(usuario);
            }
            return acc;
        }, []);

        if (responsablesUnicos.length === 0) {
            const adminsData = await Administrador.findAll({ attributes: ['id_usuario'], limit: 3 });
            const idsAdmins = adminsData.map(a => a.id_usuario);

            if (idsAdmins.length > 0) {
                const admins = await Usuario.findAll({
                    where: { id: { [Op.in]: idsAdmins } },
                    attributes: ['id', 'nombre', 'correo'],
                });
                return admins;
            }
            return [];
        }

        return responsablesUnicos;
    }

    async crearNotificacionMensajeManual({ evento, destinatarios, asunto, mensaje }, transaction = null) {
        try {
            const tipoNotificacion = await TipoNotificacion.findOne({
                where: { nombre: 'mensaje_manual_organizador' }
            });

            const notificaciones = [];
            for (const usuario of destinatarios) {
                const notif = await this.crear({
                    id_TipoNotificacion: tipoNotificacion?.id || 1,
                    titulo: asunto,
                    contenido: mensaje,
                    entidad_tipo: TIPOS_ENTIDAD.EVENTO,
                    entidad_id: evento.id,
                    id_destinatario: usuario.id,
                    id_evento: evento.id,
                    datos_adicionales: {
                        id_evento: evento.id,
                        nombre_evento: evento.titulo,
                        asunto
                    }
                }, transaction);
                notificaciones.push(notif);
            }
            return notificaciones;
        } catch (error) {
            console.error('Error al crear notificaciones de mensaje manual:', error);
            return [];
        }
    }

    async crearNotificacionCancelacionInscripcion({ inscripcion, evento, nombreAsistente }, transaction = null) {
        try {
            const tipoNotificacion = await TipoNotificacion.findOne({
                where: { nombre: 'cancelacion_inscripcion' }
            });

            const responsables = await this.obtenerResponsablesEvento(evento.id);
            const notificaciones = [];

            for (const responsable of responsables) {
                const notif = await this.crear({
                    id_TipoNotificacion: tipoNotificacion?.id || 1,
                    titulo: `Cancelación de inscripción en: ${evento.titulo}`,
                    contenido: `El asistente "${nombreAsistente}" ha cancelado su inscripción (código: ${inscripcion.codigo ?? inscripcion.id}) en el evento "${evento.titulo}".`,
                    entidad_tipo: TIPOS_ENTIDAD.EVENTO,
                    entidad_id: evento.id,
                    id_destinatario: responsable.id,
                    id_evento: evento.id,
                    datos_adicionales: {
                        id_inscripcion: inscripcion.id,
                        codigo_inscripcion: inscripcion.codigo ?? null,
                        nombre_asistente: nombreAsistente,
                        id_evento: evento.id,
                        nombre_evento: evento.titulo
                    }
                }, transaction);
                notificaciones.push(notif);
            }

            return notificaciones;
        } catch (error) {
            console.error('Error al crear notificación de cancelación de inscripción:', error);
            return [];
        }
    }

    async crearNotificacionBienvenidaOrganizador(usuario, empresa, transaction = null) {
        try {
            const tipoNotificacion = await TipoNotificacion.findOne({
                where: { nombre: 'bienvenida_organizador' }
            });
            await this.crear({
                id_TipoNotificacion: tipoNotificacion?.id || 1,
                titulo: '¡Bienvenido como Organizador!',
                contenido: `Hola ${usuario.nombre}, bienvenido a nuestra plataforma como organizador de eventos para la empresa "${empresa.nombre}". Estamos emocionados de tenerte con nosotros.`,
                entidad_tipo: TIPOS_ENTIDAD.USUARIO,
                entidad_id: usuario.id,
                id_destinatario: usuario.id,
                datos_adicionales: {
                    id_empresa: empresa.id,
                    nombre_empresa: empresa.nombre
                },
                estado: ESTADOS_NOTIFICACION.PENDIENTE,
                prioridad: 'alta'
            }, transaction);
        } catch (error) {
            console.error("Error al crear notificación de bienvenida para organizador:", error);
        }
    }

    async crearNotificacionAsignacionPonente({ ponente, actividad, evento }, transaction) {
        const tipoNotificacion = await TipoNotificacion.findOne({
            where: { nombre: 'asignacion_ponente' }
        });

        const notificaciones = [];
        const nombreEvento = evento.titulo;
        const nombrePonente = ponente.usuario?.nombre || 'un ponente';

        const notificacionPonente = await this.crear({
            id_TipoNotificacion: tipoNotificacion?.id || 1,
            titulo: 'Invitación a actividad',
            contenido: `Has sido invitado como ponente en la actividad "${actividad.titulo}" del evento "${nombreEvento}".`,
            entidad_tipo: TIPOS_ENTIDAD.PONENTE_ACTIVIDAD,
            entidad_id: ponente.id_ponente,
            id_destinatario: ponente.id_usuario,
            id_evento: evento.id,
            datos_adicionales: {
                id_ponente: ponente.id_ponente,
                id_actividad: actividad.id_actividad,
                nombre_evento: nombreEvento,
                nombre_actividad: actividad.titulo,
                fecha_actividad: actividad.fecha_actividad
            },
            estado: ESTADOS_NOTIFICACION.PENDIENTE,
            prioridad: 'alta'
        }, transaction);

        notificaciones.push(notificacionPonente);

        const responsables = await this.obtenerResponsablesEvento(evento.id);

        for (const responsable of responsables) {
            const notif = await this.crear({
                id_TipoNotificacion: tipoNotificacion?.id || 1,
                titulo: 'Nuevo ponente invitado',
                contenido: `Se invitó a ${nombrePonente} a la actividad "${actividad.titulo}" del evento "${nombreEvento}".`,
                entidad_tipo: TIPOS_ENTIDAD.PONENTE_ACTIVIDAD,
                entidad_id: ponente.id_ponente,
                id_destinatario: responsable.id,
                id_evento: evento.id,
                datos_adicionales: {
                    id_ponente: ponente.id_ponente,
                    id_actividad: actividad.id_actividad,
                    nombre_evento: nombreEvento,
                    nombre_actividad: actividad.titulo
                },
                estado: ESTADOS_NOTIFICACION.PENDIENTE,
                prioridad: 'baja'
            }, transaction);

            notificaciones.push(notif);
        }

        return notificaciones;
    }

    async crearNotificacionRespuestaInvitacion({ asignacion, aceptada, motivo_rechazo, id_ponente_usuario }, transaction) {
        const tipoNotificacion = await TipoNotificacion.findOne({
            where: { nombre: aceptada ? 'invitacion_aceptada' : 'invitacion_rechazada' }
        });

        const nombreEvento = asignacion.actividad.evento.titulo;
        const nombrePonente = asignacion.ponente.usuario.nombre || 'El ponente';

        const responsables = await this.obtenerResponsablesEvento(asignacion.actividad.id_evento);

        const notificaciones = [];

        const titulo = aceptada
            ? 'Ponente aceptó invitación'
            : 'Ponente rechazó invitación';

        const contenido = aceptada
            ? `${nombrePonente} ha aceptado la invitación para la actividad "${asignacion.actividad.titulo}" del evento "${nombreEvento}".`
            : `${nombrePonente} ha rechazado la invitación para la actividad "${asignacion.actividad.titulo}". ${motivo_rechazo ? `Motivo: ${motivo_rechazo}` : ''}`;

        for (const responsable of responsables) {
            const notif = await this.crear({
                id_TipoNotificacion: tipoNotificacion?.id || 1,
                titulo,
                contenido,
                entidad_tipo: TIPOS_ENTIDAD.PONENTE_ACTIVIDAD,
                entidad_id: asignacion.id_ponente,
                id_destinatario: responsable.id,
                id_evento: asignacion.actividad.id_evento,
                datos_adicionales: {
                    id_ponente: asignacion.id_ponente,
                    id_actividad: asignacion.id_actividad,
                    aceptada,
                    motivo_rechazo,
                    id_ponente_usuario,
                    nombre_evento: nombreEvento,
                    nombre_actividad: asignacion.actividad.titulo
                },
                estado: ESTADOS_NOTIFICACION.PENDIENTE,
                prioridad: aceptada ? 'media' : 'alta'
            }, transaction);

            notificaciones.push(notif);
        }

        return notificaciones;
    }

    async crearNotificacionSolicitudCambio({ asignacion, cambios_solicitados, justificacion, id_solicitante }, transaction) {
        const tipoNotificacion = await TipoNotificacion.findOne({
            where: { nombre: 'solicitud_cambio_actividad' }
        });

        const nombreEvento = asignacion.actividad.evento.titulo;
        const nombrePonente = asignacion.ponente.usuario.nombre || 'El ponente';
        const responsables = await this.obtenerResponsablesEvento(asignacion.actividad.id_evento);

        const notificaciones = [];

        for (const responsable of responsables) {
            const notificacion = await this.crear({
                id_TipoNotificacion: tipoNotificacion?.id || 1,
                titulo: 'Solicitud de cambio en actividad',
                contenido: `El ponente ${nombrePonente} solicita cambios en la actividad "${asignacion.actividad.titulo}" del evento "${nombreEvento}". Justificación: ${justificacion}`,
                entidad_tipo: TIPOS_ENTIDAD.PONENTE_ACTIVIDAD,
                entidad_id: asignacion.id_ponente,
                id_destinatario: responsable.id,
                id_evento: asignacion.actividad.id_evento,
                datos_adicionales: {
                    cambios_solicitados,
                    justificacion,
                    id_ponente: asignacion.id_ponente,
                    id_actividad: asignacion.id_actividad,
                    id_solicitante,
                    nombre_evento: nombreEvento,
                    nombre_actividad: asignacion.actividad.titulo
                },
                estado: ESTADOS_NOTIFICACION.PENDIENTE,
                prioridad: 'alta'
            }, transaction);

            notificaciones.push(notificacion);
        }

        return notificaciones;
    }

    async crearNotificacionRespuestaSolicitud({ asignacion, aprobada, comentarios, id_respondedor }, transaction) {
        const tipoNotificacion = await TipoNotificacion.findOne({
            where: { nombre: aprobada ? 'cambio_aprobado' : 'cambio_rechazado' }
        });

        const nombreEvento = asignacion.actividad.evento.titulo;
        const titulo = aprobada
            ? 'Solicitud de cambio aprobada'
            : 'Solicitud de cambio rechazada';

        const contenido = aprobada
            ? `Tu solicitud de cambio para la actividad "${asignacion.actividad.titulo}" del evento "${nombreEvento}" ha sido aprobada. ${comentarios || ''}`
            : `Tu solicitud de cambio para la actividad "${asignacion.actividad.titulo}" del evento "${nombreEvento}" ha sido rechazada. ${comentarios || ''}`;

        const notificacion = await this.crear({
            id_TipoNotificacion: tipoNotificacion?.id || 1,
            titulo,
            contenido,
            entidad_tipo: TIPOS_ENTIDAD.PONENTE_ACTIVIDAD,
            entidad_id: asignacion.id_ponente,
            id_destinatario: asignacion.ponente.id_usuario,
            id_evento: asignacion.actividad.id_evento,
            datos_adicionales: {
                id_ponente: asignacion.id_ponente,
                id_actividad: asignacion.id_actividad,
                aprobada,
                comentarios,
                id_respondedor,
                nombre_evento: nombreEvento,
                nombre_actividad: asignacion.actividad.titulo
            },
            estado: ESTADOS_NOTIFICACION.PENDIENTE,
            prioridad: 'alta'
        }, transaction);

        return notificacion;
    }

    async obtenerPorUsuario(usuarioId, filtros = {}) {
        const whereClause = { id_destinatario: usuarioId };

        if (filtros.estado) {
            whereClause.estado = filtros.estado;
        }

        if (filtros.entidad_tipo) {
            whereClause.entidad_tipo = filtros.entidad_tipo;
        }

        const notificaciones = await Notificacion.findAll({
            where: whereClause,
            include: [{
                model: TipoNotificacion,
                as: 'tipoNotificacion',
                attributes: ['id', 'nombre', 'descripcion']
            }],
            order: [['fecha_creacion', 'DESC']],
            limit: filtros.limit || 50
        });

        return {
            exito: true,
            notificaciones
        };
    }

    async crearNotificacionEmpresaPendiente(empresa, creador, transaction = null) {
        try {
            const tipoNotificacion = await TipoNotificacion.findOne({
                where: { nombre: 'solicitud_empresa' }
            });

            const administradores = await this._obtenerAdministradoresSistema();

            const datos_adicionales = {
                id_empresa: empresa.id,
                nombre_empresa: empresa.nombre,
                nit_empresa: empresa.nit,
                id_creador: creador.id,
                nombre_creador: creador.nombre,
                correo_creador: creador.correo
            };

            for (const admin of administradores) {
                await this.crear({
                    id_TipoNotificacion: tipoNotificacion?.id || 1,
                    titulo: 'Nueva empresa pendiente de aprobación',
                    contenido: `El usuario ${creador.nombre} ha registrado la empresa "${empresa.nombre}" (NIT: ${empresa.nit}) y requiere aprobación.`,
                    entidad_tipo: TIPOS_ENTIDAD.EMPRESA,
                    entidad_id: empresa.id,
                    id_destinatario: admin.id,
                    datos_adicionales,
                    estado: ESTADOS_NOTIFICACION.PENDIENTE,
                    prioridad: 'alta'
                }, transaction);
            }
        } catch (error) {
            console.error("Error al crear notificación de empresa pendiente:", error);
        }
    }

    async crearNotificacionRespuestaEmpresa(creador, empresa, aprobada, motivo, transaction = null) {
        try {
            const tipoNombre = aprobada ? 'empresa_aprobada' : 'empresa_rechazada';
            const tipoNotificacion = await TipoNotificacion.findOne({
                where: { nombre: tipoNombre }
            });

            const titulo = aprobada
                ? '¡Tu empresa ha sido aprobada!'
                : 'Tu solicitud de empresa ha sido rechazada';

            const contenido = aprobada
                ? `¡Felicidades! La empresa "${empresa.nombre}" que registraste ha sido aprobada por un administrador.`
                : `Lo sentimos, la solicitud para la empresa "${empresa.nombre}" ha sido rechazada. Motivo: ${motivo || 'No especificado'}.`;

            await this.crear({
                id_TipoNotificacion: tipoNotificacion?.id || 1,
                titulo,
                contenido,
                entidad_tipo: TIPOS_ENTIDAD.EMPRESA,
                entidad_id: empresa.id,
                id_destinatario: creador.id,
                datos_adicionales: {
                    id_empresa: empresa.id,
                    nombre_empresa: empresa.nombre,
                    aprobada,
                    motivo
                },
                estado: ESTADOS_NOTIFICACION.PENDIENTE,
                prioridad: 'alta'
            }, transaction);
        } catch (error) {
            console.error("Error al crear notificación de respuesta de empresa:", error);
        }
    }

    async crearNotificacionPromocionGerente(usuario, empresa, transaction = null) {
        try {
            const tipoNotificacion = await TipoNotificacion.findOne({
                where: { nombre: 'promocion_gerente' }
            });

            const titulo = '¡Felicidades! Has sido promovido';
            const contenido = `Has sido promovido al rol de Gerente en la empresa "${empresa.nombre}". Ahora tienes nuevos permisos administrativos.`;

            await this.crear({
                id_TipoNotificacion: tipoNotificacion?.id || 1,
                titulo,
                contenido,
                entidad_tipo: TIPOS_ENTIDAD.USUARIO,
                entidad_id: usuario.id,
                id_destinatario: usuario.id,
                datos_adicionales: {
                    id_empresa: empresa.id,
                    nombre_empresa: empresa.nombre,
                    nuevo_rol: 'gerente'
                },
                estado: ESTADOS_NOTIFICACION.PENDIENTE,
                prioridad: 'alta'
            }, transaction);
        } catch (error) {
            console.error("Error al crear notificación de promoción a gerente:", error);
        }
    }

    async crearNotificacionEventoCancelado(evento, participantes, creador, transaction = null) {
        try {
            const tipoNotificacion = await TipoNotificacion.findOne({
                where: { nombre: 'evento_cancelado' }
            });
            const tipoId = tipoNotificacion?.id || 1;
            const tituloParticipante = `Evento Cancelado: ${evento.titulo}`;
            const contenidoParticipante = `Lamentamos informarte que el evento "${evento.titulo}", en el que estabas inscrito, ha sido cancelado.`;

            for (const usuario of participantes) {
                await this.crear({
                    id_TipoNotificacion: tipoId,
                    titulo: tituloParticipante,
                    contenido: contenidoParticipante,
                    entidad_tipo: TIPOS_ENTIDAD.EVENTO,
                    entidad_id: evento.id,
                    id_destinatario: usuario.id,
                    id_evento: evento.id,
                    datos_adicionales: { id_evento: evento.id, nombre_evento: evento.titulo },
                    estado: ESTADOS_NOTIFICACION.PENDIENTE,
                    prioridad: 'alta'
                }, transaction);
            }

            if (creador) {
                await this.crear({
                    id_TipoNotificacion: tipoId,
                    titulo: `Confirmación: Evento "${evento.titulo}" cancelado`,
                    contenido: `Has cancelado exitosamente el evento "${evento.titulo}". Se ha notificado a los asistentes y ponentes.`,
                    entidad_tipo: TIPOS_ENTIDAD.EVENTO,
                    entidad_id: evento.id,
                    id_destinatario: creador.id,
                    id_evento: evento.id,
                    datos_adicionales: { id_evento: evento.id, nombre_evento: evento.titulo },
                    estado: ESTADOS_NOTIFICACION.PENDIENTE,
                    prioridad: 'media'
                }, transaction);
            }

        } catch (error) {
            console.error("Error al crear notificaciones de cancelación de evento:", error);
        }
    }

    async crearNotificacionCancelacionActividad({ actividad, evento, ponentes }, transaction) {
        try {
            const tipoNotificacion = await TipoNotificacion.findOne({
                where: { nombre: 'cancelacion_actividad' }
            });

            const notificaciones = [];
            const tipoId = tipoNotificacion?.id || 6;
            const nombreEvento = evento.titulo;
            const nombreActividad = actividad.titulo;

            // Notificar a cada ponente asignado
            for (const ponente of ponentes) {
                const notif = await this.crear({
                    id_TipoNotificacion: tipoId,
                    titulo: `Actividad Cancelada: ${nombreActividad}`,
                    contenido: `Lamentamos informarte que la actividad "${nombreActividad}" del evento "${nombreEvento}" ha sido cancelada.`,
                    entidad_tipo: TIPOS_ENTIDAD.ACTIVIDAD,
                    entidad_id: actividad.id_actividad,
                    id_destinatario: ponente.id_usuario,
                    id_evento: evento.id,
                    datos_adicionales: {
                        id_actividad: actividad.id_actividad,
                        nombre_actividad: nombreActividad,
                        id_evento: evento.id,
                        nombre_evento: nombreEvento,
                        fecha_actividad: actividad.fecha_actividad
                    },
                    estado: ESTADOS_NOTIFICACION.PENDIENTE,
                    prioridad: 'alta'
                }, transaction);
                notificaciones.push(notif);
            }

            // Notificar a responsables del evento
            const responsables = await this.obtenerResponsablesEvento(evento.id);
            for (const responsable of responsables) {
                const notif = await this.crear({
                    id_TipoNotificacion: tipoId,
                    titulo: `Confirmación: Actividad "${nombreActividad}" cancelada`,
                    contenido: `Has cancelado la actividad "${nombreActividad}" del evento "${nombreEvento}". Se ha notificado a los ponentes asignados.`,
                    entidad_tipo: TIPOS_ENTIDAD.ACTIVIDAD,
                    entidad_id: actividad.id_actividad,
                    id_destinatario: responsable.id,
                    id_evento: evento.id,
                    datos_adicionales: {
                        id_actividad: actividad.id_actividad,
                        nombre_actividad: nombreActividad,
                        id_evento: evento.id,
                        nombre_evento: nombreEvento
                    },
                    estado: ESTADOS_NOTIFICACION.PENDIENTE,
                    prioridad: 'media'
                }, transaction);
                notificaciones.push(notif);
            }

            return notificaciones;
        } catch (error) {
            console.error("Error al crear notificaciones de cancelación de actividad:", error);
            return [];
        }
    }
    async crearNotificacionActualizacionEvento({ evento, cambios, participantes, ponentes }, transaction) {
        try {
            const tipoNotificacion = await TipoNotificacion.findOne({
                where: { nombre: 'actualizacion_evento' }
            });

            const notificaciones = [];
            const tipoId = tipoNotificacion?.id || 7;
            const nombreEvento = evento.titulo;

            const camposModificados = Object.keys(cambios);
            const descripcionCambios = camposModificados.length > 0
                ? `Campos actualizados: ${camposModificados.join(', ')}`
                : 'Se han realizado actualizaciones en el evento';

            for (const usuario of participantes) {
                const notif = await this.crear({
                    id_TipoNotificacion: tipoId,
                    titulo: `Actualización en Evento: ${nombreEvento}`,
                    contenido: `El evento "${nombreEvento}" en el que estás inscrito ha sido actualizado. ${descripcionCambios}.`,
                    entidad_tipo: TIPOS_ENTIDAD.EVENTO,
                    entidad_id: evento.id,
                    id_destinatario: usuario.id,
                    id_evento: evento.id,
                    datos_adicionales: {
                        id_evento: evento.id,
                        nombre_evento: nombreEvento,
                        cambios_realizados: cambios
                    },
                    estado: ESTADOS_NOTIFICACION.PENDIENTE,
                    prioridad: 'media'
                }, transaction);
                notificaciones.push(notif);
            }

            for (const ponente of ponentes) {
                const notif = await this.crear({
                    id_TipoNotificacion: tipoId,
                    titulo: `Actualización en Evento: ${nombreEvento}`,
                    contenido: `El evento "${nombreEvento}" donde tienes actividades asignadas ha sido actualizado. ${descripcionCambios}.`,
                    entidad_tipo: TIPOS_ENTIDAD.EVENTO,
                    entidad_id: evento.id,
                    id_destinatario: ponente.id_usuario,
                    id_evento: evento.id,
                    datos_adicionales: {
                        id_evento: evento.id,
                        nombre_evento: nombreEvento,
                        cambios_realizados: cambios
                    },
                    estado: ESTADOS_NOTIFICACION.PENDIENTE,
                    prioridad: 'media'
                }, transaction);
                notificaciones.push(notif);
            }

            return notificaciones;
        } catch (error) {
            console.error("Error al crear notificaciones de actualización de evento:", error);
            return [];
        }
    }

    async crearNotificacionRecordatorioActividad({ actividad, evento, ponente }, transaction) {
        try {
            const tipoNotificacion = await TipoNotificacion.findOne({
                where: { nombre: 'recordatorio_actividad' }
            });

            const tipoId = tipoNotificacion?.id || 8;
            const nombreEvento = evento.titulo;
            const nombreActividad = actividad.titulo;
            const fechaActividad = new Date(actividad.fecha_actividad).toLocaleDateString('es-CO', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const notificacion = await this.crear({
                id_TipoNotificacion: tipoId,
                titulo: `Recordatorio: Actividad "${nombreActividad}" próxima`,
                contenido: `Te recordamos que tienes la actividad "${nombreActividad}" del evento "${nombreEvento}" el ${fechaActividad} a las ${actividad.hora_inicio}. ¡Prepárate!`,
                entidad_tipo: TIPOS_ENTIDAD.ACTIVIDAD,
                entidad_id: actividad.id_actividad,
                id_destinatario: ponente.id_usuario,
                id_evento: evento.id,
                datos_adicionales: {
                    id_actividad: actividad.id_actividad,
                    nombre_actividad: nombreActividad,
                    id_evento: evento.id,
                    nombre_evento: nombreEvento,
                    fecha_actividad: actividad.fecha_actividad,
                    hora_inicio: actividad.hora_inicio,
                    hora_fin: actividad.hora_fin
                },
                estado: ESTADOS_NOTIFICACION.PENDIENTE,
                prioridad: 'alta'
            }, transaction);

            return notificacion;
        } catch (error) {
            console.error("Error al crear notificación de recordatorio de actividad:", error);
            return null;
        }
    }

    async crearNotificacionReconocimientoPonente({ ponente, actividad, evento }, transaction) {
        try {
            const tipoNotificacion = await TipoNotificacion.findOne({
                where: { nombre: 'reconocimiento_ponente' }
            });

            const tipoId = tipoNotificacion?.id || 9;
            const nombreEvento = evento.titulo;
            const nombreActividad = actividad.titulo;
            const nombrePonente = ponente.usuario?.nombre || 'Estimado ponente';

            const notificacion = await this.crear({
                id_TipoNotificacion: tipoId,
                titulo: '¡Gracias por tu participación!',
                contenido: `${nombrePonente}, agradecemos tu participación como ponente en la actividad "${nombreActividad}" del evento "${nombreEvento}". Tu contribución fue valiosa para el éxito del evento.`,
                entidad_tipo: TIPOS_ENTIDAD.PONENTE_ACTIVIDAD,
                entidad_id: ponente.id_ponente,
                id_destinatario: ponente.id_usuario,
                id_evento: evento.id,
                datos_adicionales: {
                    id_ponente: ponente.id_ponente,
                    id_actividad: actividad.id_actividad,
                    nombre_actividad: nombreActividad,
                    id_evento: evento.id,
                    nombre_evento: nombreEvento,
                    fecha_actividad: actividad.fecha_actividad
                },
                estado: ESTADOS_NOTIFICACION.PENDIENTE,
                prioridad: 'baja'
            }, transaction);

            return notificacion;
        } catch (error) {
            console.error("Error al crear notificación de reconocimiento de ponente:", error);
            return null;
        }
    }


    async marcarComoLeida(notificacionId, usuarioId, transaction = null) {
        const notificacion = await Notificacion.findByPk(notificacionId, { transaction });

        if (!notificacion) {
            return {
                exito: false,
                mensaje: MENSAJES.NO_ENCONTRADA
            };
        }

        if (notificacion.id_destinatario !== usuarioId) {
            return {
                exito: false,
                mensaje: MENSAJES.SIN_PERMISO_MODIFICAR
            };
        }

        await notificacion.update({
            estado: ESTADOS_NOTIFICACION.LEIDA,
            fecha_leida: new Date()
        }, { transaction });

        return {
            exito: true,
            notificacion
        };
    }

    async buscarPorId(notificacionId, transaction = null) {
        return await Notificacion.findByPk(notificacionId, {
            include: [{
                model: TipoNotificacion,
                as: 'tipoNotificacion',
                attributes: ['id', 'nombre', 'descripcion']
            }],
            ...(transaction && { transaction })
        });
    }
}

module.exports = new NotificacionService();