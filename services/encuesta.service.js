const { Encuesta, RespuestaEncuesta, Evento, Actividad, Inscripcion, Asistente, Usuario } = require('../models');
const { Op } = require('sequelize');
const { ESTADOS_ENCUESTA, ESTADOS_RESPUESTA } = require('../constants/encuesta.constants');

class EncuestaService {
    crearTransaccion() {
        return Encuesta.sequelize.transaction();
    }

    construirURLConParametros(urlBase, parametros) {
        const url = new URL(urlBase);
        Object.keys(parametros).forEach(key => {
            url.searchParams.append(key, parametros[key]);
        });
        return url.toString();
    }

    async crear(datosEncuesta, transaction) {
        const encuesta = await Encuesta.create({
            ...datosEncuesta,
            estado: datosEncuesta.estado || ESTADOS_ENCUESTA.BORRADOR
        }, { transaction });

        return encuesta;
    }

    async actualizar(encuestaId, datosActualizacion, transaction) {
        const encuesta = await Encuesta.findByPk(encuestaId);

        if (!encuesta) {
            throw new Error('Encuesta no encontrada');
        }

        const actualizaciones = this._construirActualizaciones(datosActualizacion);
        await encuesta.update(actualizaciones, { transaction });

        return encuesta;
    }

    async eliminar(encuestaId, transaction) {
        const encuesta = await Encuesta.findByPk(encuestaId);

        if (! encuesta) {
            throw new Error('Encuesta no encontrada');
        }

        await RespuestaEncuesta.destroy({
            where: { id_encuesta: encuestaId },
            transaction
        });

        await encuesta.destroy({ transaction });
    }

    async buscarPorId(encuestaId) {
        return await Encuesta. findByPk(encuestaId, {
            include: [
                { model: Evento, as: 'evento', attributes: ['id', 'titulo', 'fecha_inicio', 'fecha_fin'] },
                { model: Actividad, as: 'actividad', attributes: ['id_actividad', 'titulo', 'fecha_actividad', 'hora_inicio', 'hora_fin'] }
            ]
        });
    }

    async obtenerPorEvento(eventoId) {
        return await Encuesta.findAll({
            where: { id_evento: eventoId },
            include: [
                { model: RespuestaEncuesta, as: 'respuestas', attributes: ['id', 'estado', 'fecha_envio', 'fecha_completado'] }
            ],
            order: [['fecha_creacion', 'DESC']]
        });
    }

    async obtenerPorActividad(actividadId) {
        return await Encuesta.findAll({
            where: { id_actividad: actividadId },
            include: [
                { model: RespuestaEncuesta, as: 'respuestas', attributes: ['id', 'estado', 'fecha_envio', 'fecha_completado'] }
            ],
            order: [['fecha_creacion', 'DESC']]
        });
    }

    async obtenerPorPonente(listaActividadId) {
        return await Encuesta.findAll({
            where: {
                id_actividad: { [Op.in]: listaActividadId },
                habilitada_para_ponente: true
            },
            include: [
                { model: RespuestaEncuesta, as: 'respuestas', attributes: ['id', 'estado', 'fecha_envio', 'fecha_completado'] }
            ],
            order: [['fecha_creacion', 'DESC']]
        });
    }

    async obtenerPorPonenteEvento(listaActividadId, eventoId) {
        return await Encuesta.findAll({
            where: {
                id_actividad: { [Op.in]: listaActividadId },
                id_evento: eventoId,
                habilitada_para_ponente: true
            },
            include: [
                { model: RespuestaEncuesta, as: 'respuestas', attributes: ['id', 'estado', 'fecha_envio', 'fecha_completado'] }
            ],
            order: [['fecha_creacion', 'DESC']]
        });
    }

    async obtenerPorPonenteActividad(actividadId) {
        return await Encuesta.findAll({
            where: {
                id_actividad: actividadId,
                habilitada_para_ponente: true
            },
            include: [
                { model: RespuestaEncuesta, as: 'respuestas', attributes: ['id', 'estado', 'fecha_envio', 'fecha_completado'] }
            ],
            order: [['fecha_creacion', 'DESC']]
        });
    }

    async habilitarParaPonente(encuestaId, actividadId, transaction) {
        const encuesta = await Encuesta.findByPk(encuestaId);
        if (!encuesta) {
            throw new Error('Encuesta no encontrada');
        }
        await encuesta.update({
            habilitada_para_ponente: true,
            id_actividad: actividadId
        }, { transaction });
        return encuesta;
    }

    async crearEncuestaRapida(datos, transaction) {
        const encuesta = await Encuesta.create({
            ...datos,
            es_encuesta_rapida: true,
            tipo_creador: 'ponente',
            estado: ESTADOS_ENCUESTA.ACTIVA
        }, { transaction });
        return encuesta;
    }

    async obtenerEncuestasActivas(filtros = {}) {
        const where = { estado: ESTADOS_ENCUESTA. ACTIVA };
        const fechaHoy = new Date(). toISOString(). split('T')[0];

        where.fecha_inicio = { [Op.lte]: fechaHoy };
        where[Op.or] = [
            { fecha_fin: null },
            { fecha_fin: { [Op. gte]: fechaHoy } }
        ];

        if (filtros.id_evento) where.id_evento = filtros.id_evento;
        if (filtros.id_actividad) where.id_actividad = filtros.id_actividad;
        if (filtros.tipo_encuesta) where. tipo_encuesta = filtros.tipo_encuesta;

        return await Encuesta.findAll({
            where,
            order: [['fecha_inicio', 'ASC']]
        });
    }

    async enviarEncuestaAsistente(encuestaId, asistenteId, transaction) {
        const encuesta = await this.buscarPorId(encuestaId);

        if (!encuesta) {
            throw new Error('Encuesta no encontrada');
        }

        const yaEnviada = await RespuestaEncuesta.findOne({
            where: {
                id_encuesta: encuestaId,
                id_asistente: asistenteId
            }
        });

        if (yaEnviada) {
            return {
                respuesta: yaEnviada,
                url_personalizada: encuesta. url_google_form
            };
        }

        const respuesta = await RespuestaEncuesta. create({
            id_encuesta: encuestaId,
            id_asistente: asistenteId,
            estado: ESTADOS_RESPUESTA.PENDIENTE,
            fecha_envio: new Date()
        }, { transaction });

        return {
            respuesta,
            url_personalizada: encuesta. url_google_form
        };
    }

    async enviarEncuestasMasivas(encuestaId, transaction) {
        const encuesta = await this.buscarPorId(encuestaId);

        if (!encuesta) {
            throw new Error('Encuesta no encontrada');
        }

        let asistentes = [];
        let eventoId = null;

        // Determinar el evento asociado (directamente o a través de la actividad)
        if (encuesta. id_evento) {
            eventoId = encuesta.id_evento;
        } else if (encuesta.id_actividad) {
            // Si la encuesta es de una actividad, obtener el evento de esa actividad
            const actividad = await Actividad.findByPk(encuesta.id_actividad, {
                attributes: ['id_actividad', 'id_evento']
            });
            
            if (actividad && actividad.id_evento) {
                eventoId = actividad.id_evento;
            }
        }

        // Buscar asistentes inscritos en el evento
        if (eventoId) {
            console.log(`Buscando asistentes para evento ID: ${eventoId}`);
            
            const inscripciones = await Inscripcion. findAll({
                where: {
                    id_evento: eventoId,
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

            console.log(`Inscripciones encontradas: ${inscripciones.length}`);

            asistentes = inscripciones.map(i => ({
                id: i.asistente.id_asistente,
                nombre: i.asistente.usuario.nombre,
                correo: i.asistente.usuario.correo
            }));

            console.log(`Asistentes a enviar encuesta: ${asistentes.length}`);
        } else {
            console.log('No se encontró evento asociado a la encuesta');
        }

        const envios = [];
        for (const asistente of asistentes) {
            const resultado = await this.enviarEncuestaAsistente(
                encuestaId,
                asistente. id,
                transaction
            );

            envios.push({
                asistente,
                url: resultado.url_personalizada
            });
        }

        console.log(`Total de envíos preparados: ${envios.length}`);

        return envios;
    }

    async marcarComoCompletada(encuestaId, asistenteId) {
        const respuesta = await RespuestaEncuesta. findOne({
            where: {
                id_encuesta: encuestaId,
                id_asistente: asistenteId
            }
        });

        if (! respuesta) {
            throw new Error('No registrado en esta encuesta');
        }

        if (respuesta.estado === 'completada') {
            throw new Error('Encuesta ya completada');
        }

        await respuesta.update({
            estado: 'completada',
            fecha_completado: new Date()
        });

        return respuesta;
    }

    async obtenerEstadisticas(encuestaId) {
        const encuesta = await this.buscarPorId(encuestaId);

        if (!encuesta) {
            throw new Error('Encuesta no encontrada');
        }

        const totalEnviadas = await RespuestaEncuesta.count({
            where: { id_encuesta: encuestaId }
        });

        const totalCompletadas = await RespuestaEncuesta.count({
            where: {
                id_encuesta: encuestaId,
                estado: ESTADOS_RESPUESTA.COMPLETADA
            }
        });

        const totalPendientes = await RespuestaEncuesta.count({
            where: {
                id_encuesta: encuestaId,
                estado: ESTADOS_RESPUESTA.PENDIENTE
            }
        });

        const tasaRespuesta = totalEnviadas > 0
            ? ((totalCompletadas / totalEnviadas) * 100).toFixed(2)
            : 0;

        const respuestas = await RespuestaEncuesta. findAll({
            where: { id_encuesta: encuestaId },
            include: [{
                model: Asistente,
                as: 'asistente',
                include: [{
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombre', 'correo']
                }]
            }],
            order: [['fecha_envio', 'DESC']]
        });

        return {
            encuesta: encuesta. toJSON(),
            estadisticas: {
                total_enviadas: totalEnviadas,
                total_completadas: totalCompletadas,
                total_pendientes: totalPendientes,
                tasa_respuesta: `${tasaRespuesta}%`
            },
            respuestas: respuestas.map(r => ({
                id: r.id,
                asistente: r. asistente?. usuario || null,
                estado: r.estado,
                fecha_envio: r.fecha_envio,
                fecha_completado: r.fecha_completado
            }))
        };
    }

    async obtenerRespuestasEncuestaAsistentes(asistente) {
        const respuestas = await RespuestaEncuesta.findAll({
            where: {
                id_asistente: asistente
            },
            include: [{
                model: Encuesta,
                as: 'encuesta',
                attributes: ['id', 'titulo', 'tipo_encuesta', 'momento', 'url_google_form', 'estado']
            }]
        });
        return respuestas;
    }


    _construirActualizaciones(datos) {
        const camposPermitidos = [
            'titulo',
            'tipo_encuesta',
            'momento',
            'url_google_form',
            'url_respuestas',
            'estado',
            'fecha_inicio',
            'fecha_fin',
            'obligatoria',
            'descripcion',
            'habilitada_para_ponente',
            'es_encuesta_rapida',
            'tipo_creador',
            'id_actividad'
        ];

        const actualizaciones = {};
        camposPermitidos. forEach(campo => {
            if (datos[campo] !== undefined) {
                actualizaciones[campo] = datos[campo];
            }
        });

        return actualizaciones;
    }
}

module.exports = new EncuestaService();
