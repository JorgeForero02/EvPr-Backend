const { Actividad, Evento, Lugar, LugarActividad, PonenteActividad, Ponente, Usuario, Ubicacion } = require('../models');
const notificacionService = require('./notificacion.service');
const EncuestaService = require('./encuesta.service');

class ActividadService {

    crearTransaccion() {
        return Actividad.sequelize.transaction();
    }

    async buscarEventoPorId(eventoId) {
        return await Evento.findByPk(eventoId);
    }

    async buscarTodasPorEvento(eventoId) {
        return await Actividad.findAll({
            where: { id_evento: eventoId },
            include: [
                {
                    model: Lugar,
                    as: 'lugares',
                    attributes: ['id', 'nombre', 'descripcion'],
                    through: { attributes: [] }
                }
            ],
            order: [['fecha_actividad', 'ASC'], ['hora_inicio', 'ASC'], ['id_actividad', 'ASC']]
        });
    }

    async buscarPorId(actividadId, opcionesInclude = {}) {
        return await Actividad.findByPk(actividadId, opcionesInclude);
    }

    async obtenerLugaresPorActividad(actividadId) {
        const actividad = await Actividad.findByPk(actividadId, { attributes: ['id_actividad', 'id_evento'] });
        if (!actividad) return [];
        const evento = await Evento.findByPk(actividad.id_evento, { attributes: ['id', 'id_empresa'] });
        if (!evento) return [];
        return await Lugar.findAll({
            where: { id_empresa: evento.id_empresa, activo: 1 },
            attributes: ['id', 'nombre', 'capacidad', 'descripcion'],
            include: [{ model: Ubicacion, as: 'ubicacion', attributes: ['lugar', 'direccion'] }],
            order: [['nombre', 'ASC']]
        });
    }

    async crear(eventoId, datosActividad, evento, transaction) {
        const { titulo, hora_inicio, hora_fin, descripcion, fecha_actividad, url, lugares, presupuesto } = datosActividad;
        const actividad = await Actividad.create({
            id_evento: eventoId,
            titulo,
            hora_inicio,
            hora_fin,
            descripcion,
            fecha_actividad,
            url,
            presupuesto: presupuesto ?? 0
        }, { transaction });

        if (lugares && Array.isArray(lugares) && lugares.length > 0) {
            await this._asociarLugares(actividad.id_actividad, lugares, transaction);
        }

        return actividad;
    }

    async actualizar(actividadId, datosActualizacion, evento, transaction) {
        const { lugares, ...camposActividad } = datosActualizacion;
        const actividad = await this.buscarPorId(actividadId);

        if (lugares !== undefined && Array.isArray(lugares)) {
            await this._actualizarLugares(actividadId, lugares, evento, transaction);
        }

        const actualizaciones = this._construirObjetoActualizacion(camposActividad);
        await actividad.update(actualizaciones, { transaction });
        return actividad;
    }

    async eliminar(actividadId, transaction) {
        const actividad = await this.buscarPorId(actividadId, {
            include: [
                {
                    model: Evento,
                    as: 'evento',
                    attributes: ['id', 'titulo']
                }
            ]
        });

        const ahora = new Date();
        const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' });
        const fechaHoy = formatter.format(ahora);
        const horaActual = ahora.toLocaleTimeString('en-GB', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const fechaActividad = actividad.fecha_actividad;

        const estaEnCurso = fechaActividad === fechaHoy &&
            actividad.hora_inicio <= horaActual && actividad.hora_fin > horaActual;
        const esFinalizada = fechaActividad < fechaHoy ||
            (fechaActividad === fechaHoy && actividad.hora_fin <= horaActual);

        if (estaEnCurso) {
            const err = new Error('No se puede eliminar una actividad que está en curso.');
            err.codigoEstado = 400;
            throw err;
        }
        if (esFinalizada) {
            const err = new Error('No se puede eliminar una actividad que ya finalizó.');
            err.codigoEstado = 400;
            throw err;
        }

        const ponentesActividad = await PonenteActividad.findAll({
            where: { id_actividad: actividadId },
            include: [
                {
                    model: Ponente,
                    as: 'ponente',
                    include: [
                        {
                            model: Usuario,
                            as: 'usuario',
                            attributes: ['id', 'nombre', 'correo']
                        }
                    ]
                }
            ]
        });

        const ponentes = ponentesActividad.map(pa => ({
            ...pa.ponente.toJSON(),
            id_usuario: pa.ponente.usuario.id
        }));

        await LugarActividad.destroy({
            where: { id_actividad: actividadId },
            transaction
        });

        await PonenteActividad.destroy({
            where: { id_actividad: actividadId },
            transaction
        });

        await actividad.destroy({ transaction });

        if (actividad.evento && ponentes.length > 0) {
            try {
                await notificacionService.crearNotificacionCancelacionActividad({
                    actividad: actividad.toJSON(),
                    evento: actividad.evento.toJSON(),
                    ponentes
                }, transaction);
            } catch (error) {
                console.error('Error al crear notificaciones de cancelación:', error);
            }
        }
    }

    async validarLugares(idsLugares, idEmpresa) {
        if (!idsLugares || !Array.isArray(idsLugares) || idsLugares.length === 0) {
            return true;
        }

        const lugaresValidos = await Lugar.findAll({
            where: { id: idsLugares, id_empresa: idEmpresa }
        });

        return lugaresValidos.length === idsLugares.length;
    }

    async _asociarLugares(actividadId, idsLugares, transaction) {
        const lugaresActividad = idsLugares.map(id_lugar => ({
            id_lugar,
            id_actividad: actividadId
        }));
        await LugarActividad.bulkCreate(lugaresActividad, { transaction });
    }

    async _actualizarLugares(actividadId, idsLugares, evento, transaction) {
        await LugarActividad.destroy({
            where: { id_actividad: actividadId },
            transaction
        });

        if (idsLugares.length > 0) {
            await this._asociarLugares(actividadId, idsLugares, transaction);
        }
    }

    _construirObjetoActualizacion(campos) {
        const actualizaciones = {};
        const camposPermitidos = ['titulo', 'hora_inicio', 'hora_fin', 'descripcion', 'fecha_actividad', 'url', 'presupuesto'];
        camposPermitidos.forEach(campo => {
            if (campos[campo] !== undefined) {
                actualizaciones[campo] = campos[campo];
            }
        });
        return actualizaciones;
    }

    async enviarEncuestasPreActividad(actividadId, transaction) {
        try {
            const encuestas = await EncuestaService.obtenerEncuestasActivas({
                id_actividad: actividadId,
                tipo_encuesta: 'pre_actividad'
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
            console.error('Error al enviar encuestas pre-actividad:', error);
            throw error;
        }
    }

    async enviarEncuestasPostActividad(actividadId, transaction) {
        try {
            const encuestas = await EncuestaService.obtenerEncuestasActivas({
                id_actividad: actividadId,
                tipo_encuesta: 'post_actividad'
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
            console.error('Error al enviar encuestas post-actividad:', error);
            throw error;
        }
    }
}

module.exports = new ActividadService();
