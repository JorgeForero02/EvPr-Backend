const { MENSAJES_VALIDACION, ROLES_PERMITIDOS } = require('../constants/auth.constants');

class AuthValidator {
    validarRegistro({ nombre, cedula, correo, contraseña, rol }) {
        if (!nombre || nombre.trim().length < 3) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.NOMBRE_REQUERIDO
            };
        }

        if (!cedula || cedula.trim().length < 5) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.CEDULA_INVALIDA
            };
        }

        if (!correo || !this._validarEmail(correo)) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.CORREO_INVALIDO
            };
        }

        if (!contraseña || contraseña.length < 6) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.CONTRASENA_CORTA
            };
        }

        return { esValida: true };
    }

    validarCreacionOrganizador({ nombre, cedula, correo, contraseña, id_empresa }) {
        const validacionBase = this.validarRegistro({ nombre, cedula, correo, contraseña });

        if (!validacionBase.esValida) {
            return validacionBase;
        }

        if (!id_empresa) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.ID_EMPRESA_REQUERIDO
            };
        }

        return { esValida: true };
    }

    validarRecuperacionContrasena({ correo, contraseña }) {
        if (!correo || !this._validarEmail(correo)) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.CORREO_INVALIDO
            };
        }

        if (!contraseña || contraseña.length < 6) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.CONTRASENA_CORTA
            };
        }

        return { esValida: true };
    }

    validarCreacionPorAdmin({ nombre, cedula, correo, contraseña, rol }, usuarioAutenticado) {
        const validacionBase = this.validarRegistro({ nombre, cedula, correo, contraseña, rol });

        if (!validacionBase.esValida) {
            return validacionBase;
        }

        if (!rol || !ROLES_PERMITIDOS.ADMIN.includes(rol)) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.ROL_INVALIDO
            };
        }

        if (usuarioAutenticado.rol !== 'administrador') {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.SOLO_ADMIN,
                codigoEstado: 403
            };
        }

        return { esValida: true };
    }

    _validarEmail(correo) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(correo);
    }
}

module.exports = new AuthValidator();
