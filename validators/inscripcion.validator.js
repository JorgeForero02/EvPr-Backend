const { MENSAJES_VALIDACION } = require('../constants/inscripcion.constants');

class InscripcionValidator {
    validarInscripcionEquipo(eventoId, cedulas) {
        if (!eventoId || cedulas.length === 0) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.CAMPOS_REQUERIDOS_EQUIPO
            };
        }

        return { esValida: true };
    }
}

module.exports = new InscripcionValidator();
