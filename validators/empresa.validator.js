const { MENSAJES_VALIDACION } = require('../constants/empresa.constants');

class EmpresaValidator {
    validarCreacion(datos, rol) {
        const { nombre, nit } = datos;

        if (!nombre || nombre.trim().length < 3) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.NOMBRE_REQUERIDO
            };
        }

        if (!nit) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.NIT_REQUERIDO
            };
        }

        const NIT_REGEX = /^\d{9}-\d{1}$/;
        if (!NIT_REGEX.test(nit.trim())) {
            return {
                esValida: false,
                mensaje: 'El NIT debe tener el formato: 123456789-0'
            };
        }

        if (rol !== 'administrador' && rol !== 'asistente') {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.ROL_NO_PERMITIDO
            };
        }

        return { esValida: true };
    }
}

module.exports = new EmpresaValidator();
