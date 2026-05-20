const AsistenciaService = require('../services/asistencia.service');
const PermisosService = require('../services/permisos.service');
const { CODIGOS_HTTP, MENSAJES } = require('../constants/asistencia.constants');

class AsistenciaValidator {
    async validarRegistroPorCodigo(codigo, usuario, transaction) {
        const inscripcion = await AsistenciaService.buscarInscripcionPorCodigo(codigo, transaction);

        if (!inscripcion) {
            return {
                esValida: false,
                mensaje: MENSAJES.CODIGO_INVALIDO,
                codigoEstado: CODIGOS_HTTP.NOT_FOUND
            };
        }

        const validacionEstado = this._validarEstadoInscripcion(inscripcion);
        if (!validacionEstado.esValida) {
            return validacionEstado;
        }

        const evento = inscripcion.evento;

        const tienePermiso = PermisosService.verificarPermisoEscrituraEvento(usuario, evento);
        if (!tienePermiso) {
            return {
                esValida: false,
                mensaje: MENSAJES.SIN_PERMISO_ESCANEAR_CODIGO,
                codigoEstado: CODIGOS_HTTP.FORBIDDEN
            };
        }

        const validacionEvento = this._validarDisponibilidadEvento(evento);
        if (!validacionEvento.esValida) {
            return validacionEvento;
        }

        return { esValida: true, inscripcion, evento };
    }

    validarFechaEnRangoEvento(fecha, fechaInicio, fechaFin) {
        if (fecha < fechaInicio || fecha > fechaFin) {
            return {
                esValida: false,
                mensaje: MENSAJES.FECHA_FUERA_RANGO
            };
        }
        return { esValida: true };
    }

    _validarEstadoInscripcion(inscripcion) {
        if (inscripcion.estado !== 'Confirmada') {
            return {
                esValida: false,
                mensaje: MENSAJES.INSCRIPCION_NO_CONFIRMADA,
                codigoEstado: CODIGOS_HTTP.BAD_REQUEST
            };
        }
        return { esValida: true };
    }

    _validarEstadoEvento(evento) {
        if (evento.estado !== 1) {
            return {
                esValida: false,
                mensaje: MENSAJES.EVENTO_NO_DISPONIBLE,
                codigoEstado: CODIGOS_HTTP.BAD_REQUEST
            };
        }
        return { esValida: true };
    }

    _validarDisponibilidadEvento(evento) {
        if (evento.estado !== 1) {
            return {
                esValida: false,
                mensaje: MENSAJES.EVENTO_NO_DISPONIBLE_CODIGO,
                codigoEstado: CODIGOS_HTTP.BAD_REQUEST
            };
        }
        return { esValida: true };
    }
}

module.exports = new AsistenciaValidator();
