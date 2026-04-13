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

        if (!nit || nit.trim().length < 5) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.NIT_REQUERIDO
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
