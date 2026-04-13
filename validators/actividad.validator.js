const { MENSAJES_VALIDACION } = require('../constants/actividad.constants');
const { Actividad, Lugar, Ponente, PonenteActividad, LugarActividad, Inscripcion } = require('../models');
const { Op } = require('sequelize');

class ActividadValidator {

    validarCreacion(datosActividad, evento) {
        const { titulo, hora_inicio, hora_fin, fecha_actividad } = datosActividad;

        if (!titulo || titulo.trim().length < 3) {
            return MENSAJES_VALIDACION.TITULO_REQUERIDO;
        }

        if (!hora_inicio || !hora_fin) {
            return MENSAJES_VALIDACION.HORAS_REQUERIDAS;
        }

        if (hora_inicio >= hora_fin) {
            return MENSAJES_VALIDACION.HORAS_INVALIDAS;
        }

        if (!fecha_actividad) {
            return MENSAJES_VALIDACION.FECHA_REQUERIDA;
        }

        const errorFecha = this._validarFechaActividad(fecha_actividad, evento);
        if (errorFecha) {
            return errorFecha;
        }

        return null;
    }

    validarActualizacion(datosActualizacion, actividad, evento) {
        const horaInicio = datosActualizacion.hora_inicio || actividad.hora_inicio;
        const horaFin = datosActualizacion.hora_fin || actividad.hora_fin;

        if (horaInicio >= horaFin) {
            return MENSAJES_VALIDACION.HORAS_INVALIDAS;
        }

        const fechaActividad = datosActualizacion.fecha_actividad || actividad.fecha_actividad;
        const errorFecha = this._validarFechaActividad(fechaActividad, evento);
        if (errorFecha) {
            return errorFecha;
        }

        return null;
    }

    async validarSolapamiento(actividadId, eventoId, fechaActividad, horaInicio, horaFin, idsLugares = [], idsPonentes = []) {
        if (idsLugares.length > 0) {
            const conflictoSala = await this._verificarConflictoSala(
                actividadId, fechaActividad, horaInicio, horaFin, idsLugares
            );
            if (conflictoSala) return conflictoSala;
        }

        if (idsPonentes && idsPonentes.length > 0) {
            const conflictoPonente = await this._verificarConflictoPonente(
                actividadId, eventoId, fechaActividad, horaInicio, horaFin, idsPonentes
            );
            if (conflictoPonente) return conflictoPonente;
        }

        return null;
    }

    async _verificarConflictoSala(actividadId, fechaActividad, horaInicio, horaFin, idsLugares) {
        const asignaciones = await LugarActividad.findAll({
            where: { id_lugar: { [Op.in]: idsLugares } },
            include: [{
                model: Actividad,
                as: 'actividad',
                required: true,
                where: {
                    fecha_actividad: fechaActividad,
                    id_actividad: { [Op.ne]: actividadId || 0 }
                }
            }]
        });

        for (const asignacion of asignaciones) {
            const act = asignacion.actividad;
            if (this._detectarSolapamientoHorario(horaInicio, horaFin, act.hora_inicio, act.hora_fin)) {
                return {
                    mensaje: `Conflicto de sala: el horario se superpone con la actividad "${act.titulo}" (${act.hora_inicio.slice(0,5)}–${act.hora_fin.slice(0,5)}).`,
                    actividadConflicto: {
                        titulo: act.titulo,
                        hora_inicio: act.hora_inicio,
                        hora_fin: act.hora_fin
                    }
                };
            }
        }
        return null;
    }

    async _verificarConflictoPonente(actividadId, eventoId, fechaActividad, horaInicio, horaFin, idsPonentes) {
        const asignaciones = await PonenteActividad.findAll({
            where: { id_ponente: { [Op.in]: idsPonentes } },
            include: [{
                model: Actividad,
                as: 'actividad',
                required: true,
                where: {
                    fecha_actividad: fechaActividad,
                    id_actividad: { [Op.ne]: actividadId || 0 }
                }
            }]
        });

        for (const asignacion of asignaciones) {
            const act = asignacion.actividad;
            if (this._detectarSolapamientoHorario(horaInicio, horaFin, act.hora_inicio, act.hora_fin)) {
                return {
                    mensaje: `Conflicto de ponente: el horario se superpone con la actividad "${act.titulo}" (${act.hora_inicio.slice(0,5)}–${act.hora_fin.slice(0,5)}).`,
                    actividadConflicto: {
                        titulo: act.titulo,
                        hora_inicio: act.hora_inicio,
                        hora_fin: act.hora_fin
                    }
                };
            }
        }
        return null;
    }

    async validarCapacidadSala(idsLugares, eventoId) {
        if (!idsLugares || idsLugares.length === 0) return null;

        const inscritosConfirmados = await Inscripcion.count({
            where: { id_evento: eventoId, estado: 'Confirmada' }
        });

        for (const lugarId of idsLugares) {
            const lugar = await Lugar.findByPk(lugarId, { attributes: ['id', 'nombre', 'capacidad'] });
            if (lugar && lugar.capacidad !== null && inscritosConfirmados > lugar.capacidad) {
                return `La sala "${lugar.nombre}" tiene capacidad para ${lugar.capacidad} persona(s) y el evento tiene ${inscritosConfirmados} inscritos confirmados.`;
            }
        }
        return null;
    }

    _detectarSolapamientoHorario(inicio1, fin1, inicio2, fin2) {
        return inicio1 < fin2 && fin1 > inicio2;
    }

    _validarFechaActividad(fechaActividad, evento) {
        if (fechaActividad < evento.fecha_inicio || fechaActividad > evento.fecha_fin) {
            return MENSAJES_VALIDACION.FECHA_FUERA_RANGO;
        }
        return null;
    }
}

module.exports = new ActividadValidator();
