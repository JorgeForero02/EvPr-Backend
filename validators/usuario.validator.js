const { MENSAJES_VALIDACION } = require('../constants/usuario.constants');
const UsuarioService = require('../services/usuario.service');

class UsuarioValidator {
  validarCreacionUsuario({ nombre, cedula, telefono, correo, contraseña, rol, roleData }) {
    const camposRequeridos = ['nombre', 'cedula', 'correo', 'contraseña', 'rol'];

    for (const campo of camposRequeridos) {
      if (!arguments[0][campo]) {
        return {
          esValida: false,
          mensaje: MENSAJES_VALIDACION.FALTAN_CAMPOS_OBLIGATORIOS
        };
      }
    }

    return { esValida: true };
  }

  async validarActualizacionPerfil({ nombre, telefono, cedula }, userId) {
    if (cedula) {
      const usuario = await UsuarioService.buscarPorId(userId);
      if (usuario && cedula !== usuario.cedula) {
        const usuarioCedula = await UsuarioService.buscarPorCedula(cedula);
        if (usuarioCedula && usuarioCedula.id !== parseInt(userId)) {
          return {
            esValida: false,
            mensaje: MENSAJES_VALIDACION.CEDULA_YA_REGISTRADA
          };
        }
      }
    }

    return { esValida: true };
  }

  validarCambioContrasena({ contraseña_actual, contraseña_nueva }) {
    if (!contraseña_actual || !contraseña_nueva) {
      return {
        esValida: false,
        mensaje: MENSAJES_VALIDACION.CONTRASENAS_REQUERIDAS
      };
    }

    if (contraseña_nueva.length < 6) {
      return {
        esValida: false,
        mensaje: MENSAJES_VALIDACION.CONTRASENA_CORTA
      };
    }

    return { esValida: true };
  }
}

module.exports = new UsuarioValidator();
