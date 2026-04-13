const { Op } = require('sequelize');
const { PonenteActividad, Ponente, Actividad, Usuario, Evento, Lugar, Ubicacion } = require('../models');
const { MENSAJES } = require('../constants/ponenteActividad.constants');
const NotificacionService = require('./notificacion.service');
const EmailService = require('./emailService');

class PonenteActividadService {
    crearTransaccion() {
        return PonenteActividad.sequelize.transaction();
    }

    async asignar(datosAsignacion, transaction) {
        const datos = {
            ...datosAsignacion,
            estado: datosAsignacion.estado || 'pendiente',
            fecha_asignacion: new Date()
        };

        const asignacion = await PonenteActividad.create(datos, { transaction });

        const asignacionCompleta = await this.buscarPorIds(
            datos.id_ponente,
            datos.id_actividad,
            transaction
        );

        return asignacionCompleta;
    }

    async obtenerPonentesDisponibles() {
        const ponentes = await Ponente.findAll({
            include: [{
                model: Usuario,
                as: 'usuario',
                attributes: ['id', 'nombre', 'correo', 'telefono', 'cedula'],
                where: { activo: 1 }, 
                required: true 
            }],
            order: [[{ model: Usuario, as: 'usuario' }, 'nombre', 'ASC']] 
        });

        return { exito: true, ponentes };
    }

    async obtenerPorActividad(actividadId) {
        const actividad = await Actividad.findByPk(actividadId);
        if (!actividad) {
            return {
                exito: false,
                mensaje: MENSAJES.ACTIVIDAD_NO_ENCONTRADA
            };
        }

        const asignaciones = await PonenteActividad.findAll({
            where: { id_actividad: actividadId },
            include: [
                {
                    model: Ponente,
                    as: 'ponente',
                    include: [{
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['id', 'nombre', 'correo']
                    }]
                }
            ],
            order: [['fecha_asignacion', 'DESC']]
        });

        return {
            exito: true,
            asignaciones
        };
    }

    async obtenerPorPonente(ponenteId, filtros = {}) {
        const ponente = await Ponente.findByPk(ponenteId);
        if (!ponente) {
            return {
                exito: false,
                mensaje: MENSAJES.PONENTE_NO_ENCONTRADO
            };
        }

        const whereAsignacion = { id_ponente: ponenteId };
        if (filtros.estado) whereAsignacion.estado = filtros.estado;

        const whereActividad = {};
        if (filtros.evento_id) whereActividad.id_evento = filtros.evento_id;
        if (filtros.fecha_inicio && filtros.fecha_fin) {
            whereActividad.fecha_actividad = { [Op.between]: [filtros.fecha_inicio, filtros.fecha_fin] };
        } else if (filtros.fecha_inicio) {
            whereActividad.fecha_actividad = { [Op.gte]: filtros.fecha_inicio };
        } else if (filtros.fecha_fin) {
            whereActividad.fecha_actividad = { [Op.lte]: filtros.fecha_fin };
        }

        const hayFiltrosActividad = Object.keys(whereActividad).length > 0;

        const asignaciones = await PonenteActividad.findAll({
            where: whereAsignacion,
            include: [
                {
                    model: Actividad,
                    as: 'actividad',
                    ...(hayFiltrosActividad ? { where: whereActividad, required: true } : {}),
                    include: [{
                        model: Evento,
                        as: 'evento',
                        attributes: ['id', 'titulo', 'fecha_inicio', 'fecha_fin']
                    }]
                }
            ],
            order: [[{ model: Actividad, as: 'actividad' }, 'fecha_actividad', 'ASC']]
        });

        return {
            exito: true,
            asignaciones
        };
    }

    async buscarPorIds(ponenteId, actividadId, transaction = null) {
        return await PonenteActividad.findOne({
            where: {
                id_ponente: ponenteId,
                id_actividad: actividadId
            },
            include: [
                {
                    model: Ponente,
                    as: 'ponente',
                    include: [{
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['id', 'nombre', 'correo']
                    }]
                },
                {
                    model: Actividad,
                    as: 'actividad',
                    include: [
                        {
                            model: Evento,
                            as: 'evento',
                            attributes: ['id', 'titulo', 'id_empresa']
                        },
                        {
                            model: Lugar,
                            as: 'lugares',
                            include: [{
                                model: Ubicacion,
                                as: 'ubicacion'
                            }],
                            through: { attributes: [] }
                        }
                    ]
                }
            ],
            ...(transaction && { transaction })
        });
    }

    async solicitarCambio({ id_ponente, id_actividad, cambios_solicitados, justificacion, id_usuario_ponente }, transaction) {
        const asignacion = await this.buscarPorIds(id_ponente, id_actividad, transaction);

        if (!asignacion) {
            throw new Error(MENSAJES.NO_ENCONTRADO);
        }

        await asignacion.update({
            estado: 'solicitud_cambio',
            notas: JSON.stringify({ justificacion, cambios_solicitados })
        }, { transaction });

        await NotificacionService.crearNotificacionSolicitudCambio({
            asignacion,
            cambios_solicitados,
            justificacion,
            id_solicitante: id_usuario_ponente
        }, transaction);

        try {
            const responsables = await NotificacionService.obtenerResponsablesEvento(asignacion.actividad.id_evento);
            
            for (const responsable of responsables) {
                await EmailService.enviarSolicitudCambioPonente(
                    responsable.correo,
                    responsable.nombre,
                    asignacion.ponente.usuario.nombre,
                    asignacion.actividad.titulo,
                    asignacion.actividad.evento.titulo,
                    justificacion
                );
            }
        } catch (emailError) {
            console.error('Error enviando emails de solicitud de cambio (pero la solicitud fue creada):', emailError);
        }

        return asignacion;
    }

    async procesarSolicitud({ id_ponente, id_actividad, aprobada, comentarios, id_usuario_admin }, transaction) {
        const asignacion = await this.buscarPorIds(id_ponente, id_actividad, transaction);

        if (!asignacion) {
            throw new Error(MENSAJES.NO_ENCONTRADO);
        }

        const nuevoEstado = aprobada ? 'aceptado' : 'rechazado';

        // Extraer cambios_solicitados del campo notas (guardados como JSON al solicitar)
        let cambiosAplicar = null;
        if (aprobada && asignacion.notas) {
            try {
                const notasData = JSON.parse(asignacion.notas);
                if (notasData.cambios_solicitados) {
                    cambiosAplicar = notasData.cambios_solicitados;
                }
            } catch (e) {
                // notas en formato antiguo (texto plano), no hay cambios que aplicar
            }
        }

        await asignacion.update({
            estado: nuevoEstado,
            fecha_respuesta: new Date(),
            notas: comentarios || asignacion.notas
        }, { transaction });

        // Aplicar los cambios a la Actividad si la solicitud fue aprobada
        if (aprobada && cambiosAplicar) {
            const camposActividad = {};
            if (cambiosAplicar.titulo) camposActividad.titulo = cambiosAplicar.titulo;
            if (cambiosAplicar.descripcion) camposActividad.descripcion = cambiosAplicar.descripcion;
            if (cambiosAplicar.fecha_actividad) camposActividad.fecha_actividad = cambiosAplicar.fecha_actividad;
            if (cambiosAplicar.hora_inicio) camposActividad.hora_inicio = cambiosAplicar.hora_inicio;
            if (cambiosAplicar.hora_fin) camposActividad.hora_fin = cambiosAplicar.hora_fin;

            if (Object.keys(camposActividad).length > 0) {
                await Actividad.update(camposActividad, {
                    where: { id_actividad: asignacion.id_actividad },
                    transaction
                });
            }
        }

        await NotificacionService.crearNotificacionRespuestaSolicitud({
            asignacion,
            aprobada,
            comentarios,
            id_respondedor: id_usuario_admin
        }, transaction);

        try {
            const ponenteUsuario = asignacion.ponente.usuario;
            await EmailService.enviarRespuestaSolicitudCambio(
                ponenteUsuario.correo,
                ponenteUsuario.nombre,
                asignacion.actividad.titulo,
                asignacion.actividad.evento.titulo,
                aprobada,
                comentarios
            );
        } catch (emailError) {
            console.error('Error enviando email de respuesta de solicitud (pero la solicitud fue procesada):', emailError);
        }

        return asignacion;
    }

    construirActualizaciones({ estado, notas }) {
        const actualizaciones = {};
        if (estado !== undefined) actualizaciones.estado = estado;
        if (notas !== undefined) actualizaciones.notas = notas;
        if (Object.keys(actualizaciones).length > 0) {
            actualizaciones.fecha_respuesta = new Date();
        }
        return actualizaciones;
    }
}

module.exports = new PonenteActividadService();
