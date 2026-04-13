const { MENSAJES_VALIDACION } = require('../constants/ciudad.constants');

class CiudadValidator {
    validarCreacion({ nombre }) {
        if (!nombre || nombre.trim().length < 2) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.NOMBRE_REQUERIDO
            };
        }

        return { esValida: true };
    }

    validarActualizacion({ nombre }) {
        if (nombre !== undefined && nombre.trim().length < 2) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.NOMBRE_INVALIDO
            };
        }

        return { esValida: true };
    }
}

module.exports = new CiudadValidator();
