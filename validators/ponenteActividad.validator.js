const { Ponente, Actividad, PonenteActividad, Evento, Usuario } = require('../models');
const { MENSAJES_VALIDACION } = require('../constants/ponenteActividad.constants');

class PonenteActividadValidator {
    async validarAsignacion({ id_ponente, id_actividad }) {
        if (!id_ponente) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.PONENTE_REQUERIDO
            };
        }

        if (!id_actividad) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.ACTIVIDAD_REQUERIDA
            };
        }

        const ponente = await Ponente.findByPk(id_ponente, {
            include: [{
                model: Usuario,
                as: 'usuario',
                attributes: ['id', 'nombre', 'correo']
            }]
        });

        if (!ponente) {
            return {
                esValida: false,
                mensaje: 'Ponente no encontrado',
                codigoEstado: 404
            };
        }

        const actividad = await Actividad.findByPk(id_actividad, {
            include: [{
                model: Evento,
                as: 'evento',
                attributes: ['id', 'titulo', 'id_empresa']
            }]
        });

        if (!actividad) {
            return {
                esValida: false,
                mensaje: 'Actividad no encontrada',
                codigoEstado: 404
            };
        }

        const asignacionExistente = await PonenteActividad.findOne({
            where: { id_ponente, id_actividad }
        });

        if (asignacionExistente) {
            return {
                esValida: false,
                mensaje: 'Este ponente ya está asignado a esta actividad',
                codigoEstado: 400
            };
        }

        return { esValida: true, ponente, actividad };
    }

    validarSolicitudCambio({ cambios_solicitados, justificacion }) {
        if (!cambios_solicitados || Object.keys(cambios_solicitados).length === 0) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.CAMBIOS_REQUERIDOS
            };
        }

        if (!justificacion || justificacion.trim().length < 10) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.JUSTIFICACION_REQUERIDA
            };
        }

        return { esValida: true };
    }

    validarEstado(estado) {
        const estadosValidos = ['pendiente', 'aceptado', 'rechazado', 'solicitud_cambio'];
        if (!estadosValidos.includes(estado)) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.ESTADO_INVALIDO
            };
        }
        return { esValida: true };
    }
}

module.exports = new PonenteActividadValidator();
