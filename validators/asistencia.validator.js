const AsistenciaService = require('../services/asistencia.service');
const { CODIGOS_HTTP, MENSAJES } = require('../constants/asistencia.constants');

class AsistenciaValidator {
    async validarRegistro(inscripcionId, usuarioId, transaction) {
        const inscripcion = await AsistenciaService.buscarInscripcionPorId(inscripcionId, transaction);

        if (!inscripcion) {
            return {
                esValida: false,
                mensaje: MENSAJES.INSCRIPCION_NO_ENCONTRADA,
                codigoEstado: CODIGOS_HTTP.NOT_FOUND
            };
        }

        const validacionEstado = this._validarEstadoInscripcion(inscripcion);
        if (!validacionEstado.esValida) {
            return validacionEstado;
        }

        const validacionPropiedad = this._validarPropiedadInscripcion(inscripcion, usuarioId);
        if (!validacionPropiedad.esValida) {
            return validacionPropiedad;
        }

        const evento = inscripcion.evento;
        const validacionEvento = this._validarEstadoEvento(evento);
        if (!validacionEvento.esValida) {
            return validacionEvento;
        }

        return { esValida: true, inscripcion, evento };
    }

    async validarRegistroPorCodigo(codigo, usuarioId, transaction) {
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

        const validacionPropiedad = this._validarPropiedadCodigo(inscripcion, usuarioId);
        if (!validacionPropiedad.esValida) {
            return validacionPropiedad;
        }

        const evento = inscripcion.evento;
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

    _validarPropiedadInscripcion(inscripcion, usuarioId) {
        if (inscripcion.asistente.id_usuario !== usuarioId) {
            return {
                esValida: false,
                mensaje: MENSAJES.NO_PUEDE_REGISTRAR_OTRA_PERSONA,
                codigoEstado: CODIGOS_HTTP.FORBIDDEN
            };
        }
        return { esValida: true };
    }

    _validarPropiedadCodigo(inscripcion, usuarioId) {
        if (inscripcion.asistente.id_usuario !== usuarioId) {
            return {
                esValida: false,
                mensaje: MENSAJES.CODIGO_NO_PERTENECE,
                codigoEstado: CODIGOS_HTTP.FORBIDDEN
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
