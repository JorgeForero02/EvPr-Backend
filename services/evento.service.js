const { Evento, Empresa, Usuario, Actividad, Inscripcion, Lugar, Asistente, Ponente, PonenteActividad, AdministradorEmpresa, Asistencia, Encuesta, RespuestaEncuesta, sequelize: db } = require('../models');
const { ESTADOS, MODALIDADES } = require('../constants/evento.constants');
const { Op } = require('sequelize');
const notificacionService = require('./notificacion.service');
const EncuestaService = require('./encuesta.service');
const EmailService = require('./emailService');

class EventoService {

    crearTransaccion() {
        return Evento.sequelize.transaction();
    }

    _obtenerFechaHoy() {
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Bogota',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        return formatter.format(new Date());
    }

    // [BACKEND-FIX] B6: Refactorizar auto-finalización para evitar race conditions.
    // Usa UPDATE con WHERE atómico para prevenir doble-finalización por requests concurrentes.
    async _actualizarEstadoFinalizado(evento) {
        if (!evento || evento.estado === ESTADOS.CANCELADO || evento.estado === ESTADOS.FINALIZADO) {
            return evento;
        }

        const fechaHoy = this._obtenerFechaHoy();

        if (evento.estado === ESTADOS.PUBLICADO && fechaHoy > evento.fecha_fin) {
            try {
                // UPDATE atómico: solo actualiza si el estado sigue siendo PUBLICADO
                const [filasAfectadas] = await Evento.update(
                    { estado: ESTADOS.FINALIZADO },
                    { where: { id: evento.id, estado: ESTADOS.PUBLICADO } }
                );

                // Solo enviar encuestas si ESTE request logró el cambio (evita duplicados)
                if (filasAfectadas > 0) {
                    evento.estado = ESTADOS.FINALIZADO;
                    const transaction = await this.crearTransaccion();
                    try {
                        await this.enviarEncuestasSatisfaccion(evento.id, transaction);
                        await transaction.commit();
                    } catch (encuestaError) {
                        await transaction.rollback();
                        console.error('Error al enviar encuestas de satisfacción:', encuestaError);
                    }
                } else {
                    // Otro request ya lo finalizó — recargar estado actual
                    await evento.reload();
                }
            } catch (error) {
                console.error(`Error al auto-finalizar evento ${evento.id}:`, error.message);
            }
        }

        return evento;
    }

    async crear(datosEvento, transaction) {
        const evento = await Evento.create({
            ...datosEvento,
            estado: ESTADOS.BORRADOR,
            fecha_creacion: new Date(),
            fecha_actualizacion: new Date()
        }, { transaction });

        return { evento };
    }

    async actualizar(eventoId, datosActualizacion, transaction) {
        const evento = await Evento.findByPk(eventoId);

        if (!evento) {
            throw new Error('Evento no encontrado');
        }

        const actualizaciones = this.construirActualizaciones(datosActualizacion);

        const cambiosRealizados = {};
        Object.keys(actualizaciones).forEach(key => {
            if (key !== 'fecha_actualizacion' && evento[key] !== actualizaciones[key]) {
                cambiosRealizados[key] = {
                    anterior: evento[key],
                    nuevo: actualizaciones[key]
                };
            }
        });

        await evento.update(actualizaciones, { transaction });

        if (Object.keys(cambiosRealizados).length > 0 && evento.estado === ESTADOS.PUBLICADO) {
            try {
                const inscripciones = await Inscripcion.findAll({
                    where: {
                        id_evento: eventoId,
                        estado: { [Op.in]: ['Confirmada', 'Pendiente'] }
                    },
                    include: [{
                        model: Asistente,
                        as: 'asistente',
                        include: [{
                            model: Usuario,
                            as: 'usuario',
                            attributes: ['id', 'nombre', 'correo']
                        }]
                    }]
                });

                const participantes = inscripciones.map(i => i.asistente.usuario.toJSON());

                const ponentesActividad = await PonenteActividad.findAll({
                    where: { estado: 'aceptado' },
                    include: [
                        {
                            model: Actividad,
                            as: 'actividad',
                            where: { id_evento: eventoId },
                            required: true,
                            attributes: []
                        },
                        {
                            model: Ponente,
                            as: 'ponente',
                            include: [{
                                model: Usuario,
                                as: 'usuario',
                                attributes: ['id', 'nombre', 'correo']
                            }]
                        }
                    ]
                });

                const ponentes = ponentesActividad.map(pa => ({
                    ...pa.ponente.toJSON(),
                    id_usuario: pa.ponente.usuario.id
                }));

                await notificacionService.crearNotificacionActualizacionEvento({
                    evento: evento.toJSON(),
                    cambios: cambiosRealizados,
                    participantes,
                    ponentes
                }, transaction);

                const camposModificados = Object.keys(cambiosRealizados);
                const todosDestinatarios = [
                    ...participantes,
                    ...ponentes.map(p => p.usuario || { id: p.id_usuario, nombre: p.nombre, correo: p.correo })
                ];
                for (const destinatario of todosDestinatarios) {
                    if (destinatario.correo) {
                        EmailService.enviarNotificacionCambioEvento(
                            destinatario.correo,
                            destinatario.nombre,
                            evento.titulo,
                            camposModificados
                        );
                    }
                }
            } catch (error) {
                console.error('Error al crear notificaciones de actualización:', error);
            }
        }

        return evento;
    }

    construirFiltros({ id, id_empresa, estado, modalidad, rol, empresaUsuario }) {
        const where = {};
        if (id) where.id = id;

        if (rol === 'gerente' || rol === 'organizador') {
            where.id_empresa = empresaUsuario;
        } else if (rol === 'administrador') {
            if (id_empresa) where.id_empresa = id_empresa;
        } else if (rol === 'ponente') {
            // Ponentes can view any event they are assigned to, regardless of estado
            if (!id) where.estado = ESTADOS.PUBLICADO;
            if (id_empresa) where.id_empresa = id_empresa;
        } else {
            where.estado = ESTADOS.PUBLICADO;
            if (id_empresa) where.id_empresa = id_empresa;
        }

        if (estado !== undefined) {
            if (rol === 'administrador') {
                where.estado = estado;
            } else {
                where.estado = ESTADOS.PUBLICADO;
            }
        }

        if (modalidad) where.modalidad = modalidad;
        return where;
    }

    async obtenerTodos(whereClause) {
        const eventos = await Evento.findAll({
            where: whereClause,
            include: [
                {
                    model: Empresa,
                    as: 'empresa',
                    attributes: ['id', 'nombre']
                },
                {
                    model: Usuario,
                    as: 'creador',
                    attributes: ['id', 'nombre', 'correo']
                },
                {
                    model: Actividad,
                    as: 'actividades',
                    attributes: ['id_actividad', 'titulo', 'fecha_actividad']
                },
                // [BACKEND-FIX] L2: Incluir inscripciones confirmadas para conteo en frontend
                {
                    model: Inscripcion,
                    as: 'inscripciones',
                    attributes: ['id'],
                    where: { estado: 'Confirmada' },
                    required: false
                }
            ],
            order: [['fecha_creacion', 'DESC']]
        });

        // [BACKEND-FIX] B6: No auto-finalizar en listados masivos (evita race conditions).
        // La auto-finalización solo ocurre en buscarUno() para el evento individual.
        return eventos;
    }

    async buscarUno(whereClause) {
        const evento = await Evento.findOne({
            where: whereClause,
            include: [
                {
                    model: Empresa,
                    as: 'empresa',
                    attributes: ['id', 'nombre', 'correo']
                },
                {
                    model: Usuario,
                    as: 'creador',
                    attributes: ['id', 'nombre', 'correo']
                },
                {
                    model: Actividad,
                    as: 'actividades',
                    include: [
                        {
                            model: Lugar,
                            as: 'lugares',
                            attributes: ['id', 'nombre'],
                            through: { attributes: [] }
                        }
                    ]
                },
                {
                    model: Inscripcion,
                    as: 'inscripciones',
                    attributes: ['id', 'fecha', 'estado']
                }
            ]
        });

        if (!evento) {
            return null;
        }

        return await this._actualizarEstadoFinalizado(evento);
    }

    construirActualizaciones(datos) {
        // [BACKEND-FIX] B13: Añadir fecha_inicio y fecha_fin al whitelist
        const camposPermitidos = ['titulo', 'descripcion', 'modalidad', 'hora', 'cupos', 'estado', 'fecha_inicio', 'fecha_fin', 'lugar_id', 'url_virtual', 'fecha_limite_cancelacion'];
        const actualizaciones = {};
        camposPermitidos.forEach(campo => {
            if (datos[campo] !== undefined) {
                let valor = datos[campo];
                // Coerce string fields: reject arrays/objects to avoid Sequelize type errors
                if (['titulo', 'descripcion', 'modalidad', 'hora', 'url_virtual'].includes(campo)) {
                    if (Array.isArray(valor) || (valor !== null && typeof valor === 'object')) {
                        valor = JSON.stringify(valor);
                    }
                }
                actualizaciones[campo] = valor;
            }
        });
        actualizaciones.fecha_actualizacion = new Date();
        return actualizaciones;
    }

    async obtenerNotificacionesCancelacion(evento) {
        const { id, id_creador } = evento;
        const notificadosMap = new Map();

        const inscripciones = await Inscripcion.findAll({
            where: {
                id_evento: id,
                estado: { [Op.in]: ['Confirmada', 'Pendiente'] }
            },
            include: [{
                model: Asistente,
                as: 'asistente',
                required: true,
                include: [{
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombre', 'correo'],
                    required: true
                }]
            }]
        });

        inscripciones.forEach(i => {
            const usuario = i.asistente.usuario.toJSON();
            notificadosMap.set(usuario.correo, usuario);
        });

        const ponentesAsignados = await PonenteActividad.findAll({
            where: {
                estado: 'aceptado'
            },
            include: [
                {
                    model: Actividad,
                    as: 'actividad',
                    where: { id_evento: id },
                    required: true,
                    attributes: []
                },
                {
                    model: Ponente,
                    as: 'ponente',
                    required: true,
                    include: [{
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['id', 'nombre', 'correo'],
                        required: true
                    }]
                }
            ]
        });

        ponentesAsignados.forEach(pa => {
            const usuario = pa.ponente.usuario.toJSON();
            notificadosMap.set(usuario.correo, usuario);
        });

        const creador = await Usuario.findByPk(id_creador, {
            attributes: ['id', 'nombre', 'correo']
        });

        const creadorJson = creador ? creador.toJSON() : null;
        if (creadorJson) {
            notificadosMap.delete(creadorJson.correo);
        }

        return {
            participantes: Array.from(notificadosMap.values()),
            creador: creadorJson
        };
    }

    // RF80 — Reporte de evento: inscritos, asistencias, tasa asistencia, encuestas
    async obtenerReporte(eventoId) {
        const evento = await Evento.findByPk(eventoId, { attributes: ['id', 'titulo'] });
        if (!evento) return null;

        const totalInscritos = await Inscripcion.count({
            where: { id_evento: eventoId, estado: 'Confirmada' }
        });

        const inscripcionIds = await Inscripcion.findAll({
            where: { id_evento: eventoId, estado: 'Confirmada' },
            attributes: ['id']
        }).then(rows => rows.map(r => r.id));

        const totalAsistencias = inscripcionIds.length > 0
            ? await Asistencia.count({ where: { inscripcion: { [Op.in]: inscripcionIds } } })
            : 0;

        const tasaAsistencia = totalInscritos > 0
            ? Math.round((totalAsistencias / totalInscritos) * 100)
            : 0;

        const totalEncuestasEnviadas = await RespuestaEncuesta.count({
            include: [{
                model: Encuesta,
                as: 'encuesta',
                where: { id_evento: eventoId },
                required: true,
                attributes: []
            }]
        });

        const totalEncuestasRespondidas = await RespuestaEncuesta.count({
            where: { estado: 'completada' },
            include: [{
                model: Encuesta,
                as: 'encuesta',
                where: { id_evento: eventoId },
                required: true,
                attributes: []
            }]
        });

        const tasaRespuesta = totalEncuestasEnviadas > 0
            ? Math.round((totalEncuestasRespondidas / totalEncuestasEnviadas) * 100)
            : 0;

        return {
            id_evento: eventoId,
            titulo: evento.titulo,
            total_inscritos: totalInscritos,
            total_asistencias: totalAsistencias,
            tasa_asistencia: tasaAsistencia,
            encuestas_enviadas: totalEncuestasEnviadas,
            encuestas_respondidas: totalEncuestasRespondidas,
            tasa_respuesta: tasaRespuesta
        };
    }

    // RF81 — Presupuesto total del evento (suma de actividades)
    async obtenerPresupuestoTotal(eventoId) {
        const evento = await Evento.findByPk(eventoId, { attributes: ['id', 'titulo'] });
        if (!evento) return null;

        const resultado = await Actividad.findOne({
            where: { id_evento: eventoId },
            attributes: [[db.fn('SUM', db.col('presupuesto')), 'total']],
            raw: true
        });

        const actividades = await Actividad.findAll({
            where: { id_evento: eventoId },
            attributes: ['id_actividad', 'titulo', 'presupuesto']
        });

        return {
            id_evento: eventoId,
            titulo: evento.titulo,
            presupuesto_total: parseFloat(resultado?.total || 0),
            actividades: actividades.map(a => ({
                id: a.id_actividad,
                titulo: a.titulo,
                presupuesto: parseFloat(a.presupuesto || 0)
            }))
        };
    }

    async obtenerInscritosConfirmados(eventoId) {
        const inscripciones = await Inscripcion.findAll({
            where: { id_evento: eventoId, estado: 'Confirmada' },
            include: [{
                model: Asistente,
                as: 'asistente',
                required: true,
                include: [{
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombre', 'correo'],
                    required: true
                }]
            }]
        });
        return inscripciones.map(i => i.asistente.usuario);
    }

    async enviarEncuestasSatisfaccion(eventoId, transaction) {
        try {
            const encuestas = await EncuestaService.obtenerEncuestasActivas({
                id_evento: eventoId,
                tipo_encuesta: 'satisfaccion_evento'
            });

            const resultados = [];
            for (const encuesta of encuestas) {
                const envios = await EncuestaService.enviarEncuestasMasivas(
                    encuesta.id,
                    transaction
                );
                resultados.push({ encuesta, envios });
            }

            return resultados;
        } catch (error) {
            console.error('Error al enviar encuestas de satisfacción:', error);
            throw error;
        }
    }
}

module.exports = new EventoService();
