const AsistenciaService = require('../services/asistencia.service');
const AsistenciaValidator = require('../validators/asistencia.validator');
const PermisosService = require('../services/permisos.service');
const AuditoriaService = require('../services/auditoriaService');
const ApiResponse = require('../utils/response');
const { CODIGOS_HTTP, MENSAJES } = require('../constants/asistencia.constants');

class AsistenciaController {

    obtenerMisAsistencias = async (req, res, next) => {
        try {
            const usuarioId = req.usuario.id;

            const asistente = await AsistenciaService.buscarAsistentePorUsuario(usuarioId);

            if (!asistente) {
                return ApiResponse.success(res, [], MENSAJES.SIN_ASISTENCIAS);
            }

            const inscripciones = await AsistenciaService.obtenerInscripcionesConAsistencias(
                asistente.id_asistente
            );

            return ApiResponse.success(res, inscripciones, MENSAJES.ASISTENCIAS_OBTENIDAS);
        } catch (error) {
            next(error);
        }
    }

    registrarAsistenciaPorCodigo = async (req, res, next) => {
        const transaction = await AsistenciaService.crearTransaccion();

        try {
            const { codigo } = req.body;
            const usuario = req.usuario;

            const validacion = await AsistenciaValidator.validarRegistroPorCodigo(
                codigo,
                usuario,
                transaction
            );

            if (!validacion.esValida) {
                await transaction.rollback();
                return this._responderError(res, validacion);
            }

            const { inscripcion, evento } = validacion;
            const fechaHoy = AsistenciaService.obtenerFechaHoy();

            const validacionFecha = AsistenciaValidator.validarFechaEnRangoEvento(
                fechaHoy,
                evento.fecha_inicio,
                evento.fecha_fin
            );

            if (!validacionFecha.esValida) {
                await transaction.rollback();
                return ApiResponse.error(res, validacionFecha.mensaje, CODIGOS_HTTP.BAD_REQUEST);
            }

            const existeAsistencia = await AsistenciaService.verificarAsistenciaExistente(
                inscripcion.id,
                fechaHoy,
                transaction
            );

            if (existeAsistencia) {
                await transaction.rollback();
                return ApiResponse.error(res, MENSAJES.ASISTENCIA_YA_REGISTRADA, CODIGOS_HTTP.CONFLICTO);
            }

            const nuevaAsistencia = await AsistenciaService.crear({
                fecha: fechaHoy,
                estado: 'Presente',
                registrado_por: 'organizador',
                inscripcion: inscripcion.id
            }, transaction);

            await AuditoriaService.registrarCreacion('asistencia', {
                id: nuevaAsistencia.id,
                evento: evento.titulo,
                asistente: usuario.nombre,
                fecha: fechaHoy,
                metodo: 'codigo_qr'
            }, usuario);

            await transaction.commit();

            return ApiResponse.success(
                res,
                {
                    asistencia: nuevaAsistencia,
                    evento: {
                        titulo: evento.titulo,
                        fecha_inicio: evento.fecha_inicio,
                        fecha_fin: evento.fecha_fin
                    }
                },
                MENSAJES.ASISTENCIA_REGISTRADA_CODIGO,
                CODIGOS_HTTP.CREADO
            );
        } catch (error) {
            if (transaction && !transaction.finished) {
                await transaction.rollback();
            }
            next(error);
        }
    }

    obtenerAsistenciasEvento = async (req, res, next) => {
        try {
            const { id_evento } = req.params;
            const { fecha } = req.query;
            const usuario = req.usuario;

            const evento = await AsistenciaService.buscarEventoPorId(id_evento);

            if (!evento) {
                return ApiResponse.notFound(res, MENSAJES.EVENTO_NO_ENCONTRADO);
            }

            const tienePermiso = PermisosService.verificarPermisoLecturaEvento(usuario, evento);

            if (!tienePermiso) {
                return ApiResponse.forbidden(res, MENSAJES.SIN_PERMISO_VER_ASISTENCIAS);
            }

            const inscripciones = await AsistenciaService.obtenerAsistenciasPorEvento(
                id_evento,
                fecha
            );

            return ApiResponse.success(
                res,
                {
                    evento: evento.titulo,
                    total_inscritos: inscripciones.length,
                    inscripciones
                },
                MENSAJES.ASISTENCIAS_EVENTO_OBTENIDAS
            );
        } catch (error) {
            next(error);
        }
    }

    registrarAsistenciaManual = async (req, res, next) => {
        const transaction = await AsistenciaService.crearTransaccion();

        try {
            const inscripcionId = parseInt(req.params.id, 10);
            const { estado } = req.body;
            const usuario = req.usuario;

            if (!estado || !['Presente', 'Ausente'].includes(estado)) {
                await transaction.rollback();
                return ApiResponse.error(res, MENSAJES.ESTADO_MANUAL_INVALIDO, CODIGOS_HTTP.BAD_REQUEST);
            }

            const inscripcion = await AsistenciaService.buscarInscripcionConEvento(inscripcionId, transaction);

            if (!inscripcion) {
                await transaction.rollback();
                return ApiResponse.notFound(res, MENSAJES.INSCRIPCION_NO_ENCONTRADA);
            }

            if (inscripcion.estado !== 'Confirmada') {
                await transaction.rollback();
                return ApiResponse.error(res, MENSAJES.INSCRIPCION_NO_CONFIRMADA, CODIGOS_HTTP.BAD_REQUEST);
            }

            const evento = inscripcion.evento;
            const tienePermiso = PermisosService.verificarPermisoLecturaEvento(usuario, evento);

            if (!tienePermiso) {
                await transaction.rollback();
                return ApiResponse.forbidden(res, MENSAJES.SIN_PERMISO_REGISTRO_MANUAL);
            }

            const fechaHoy = AsistenciaService.obtenerFechaHoy();
            const asistencia = await AsistenciaService.crearOSobrescribirManual(
                inscripcionId, estado, fechaHoy, transaction
            );

            await AuditoriaService.registrarCreacion('asistencia_manual', {
                id: asistencia.id,
                inscripcion: inscripcionId,
                estado,
                evento: evento.titulo,
                registrado_por: usuario.nombre
            }, usuario);

            await transaction.commit();

            return ApiResponse.success(res, asistencia, MENSAJES.ASISTENCIA_MANUAL_REGISTRADA);
        } catch (error) {
            if (transaction && !transaction.finished) {
                await transaction.rollback();
            }
            next(error);
        }
    }

    obtenerCodigoCheckin = async (req, res, next) => {
        try {
            const { id_evento } = req.params;
            const usuario = req.usuario;

            const evento = await AsistenciaService.buscarEventoPorId(id_evento);
            if (!evento) return ApiResponse.notFound(res, MENSAJES.EVENTO_NO_ENCONTRADO);

            const tienePermiso = PermisosService.verificarPermisoLecturaEvento(usuario, evento);
            if (!tienePermiso) return ApiResponse.forbidden(res, MENSAJES.SIN_PERMISO_VER_ASISTENCIAS);

            const fecha = AsistenciaService.obtenerFechaHoy();
            const codigo = AsistenciaService.generarCodigoCheckin(id_evento, fecha);

            return ApiResponse.success(res, { codigo, fecha, id_evento }, 'Código de check-in obtenido');
        } catch (error) {
            next(error);
        }
    }

    registrarCheckin = async (req, res, next) => {
        const transaction = await AsistenciaService.crearTransaccion();
        try {
            const { codigo_checkin, id_evento } = req.body;
            const usuarioId = req.usuario.id;

            if (!codigo_checkin || !id_evento) {
                await transaction.rollback();
                return ApiResponse.error(res, 'Se requiere codigo_checkin e id_evento.', CODIGOS_HTTP.BAD_REQUEST);
            }

            const fechaHoy = AsistenciaService.obtenerFechaHoy();
            const codigoEsperado = AsistenciaService.generarCodigoCheckin(id_evento, fechaHoy);

            if (codigo_checkin.trim().toUpperCase() !== codigoEsperado) {
                await transaction.rollback();
                return ApiResponse.error(res, MENSAJES.CODIGO_CHECKIN_INVALIDO, CODIGOS_HTTP.BAD_REQUEST);
            }

            const asistente = await AsistenciaService.buscarAsistentePorUsuario(usuarioId);
            if (!asistente) {
                await transaction.rollback();
                return ApiResponse.error(res, MENSAJES.INSCRIPCION_NO_ENCONTRADA, CODIGOS_HTTP.NOT_FOUND);
            }

            const inscripcion = await AsistenciaService.buscarInscripcionConfirmadaPorAsistenteYEvento(
                asistente.id_asistente, id_evento, transaction
            );
            if (!inscripcion) {
                await transaction.rollback();
                return ApiResponse.error(res, MENSAJES.INSCRIPCION_NO_ENCONTRADA, CODIGOS_HTTP.NOT_FOUND);
            }

            const validacionFecha = AsistenciaValidator.validarFechaEnRangoEvento(
                fechaHoy, inscripcion.evento.fecha_inicio, inscripcion.evento.fecha_fin
            );
            if (!validacionFecha.esValida) {
                await transaction.rollback();
                return ApiResponse.error(res, validacionFecha.mensaje, CODIGOS_HTTP.BAD_REQUEST);
            }

            const existeAsistencia = await AsistenciaService.verificarAsistenciaExistente(
                inscripcion.id, fechaHoy, transaction
            );
            if (existeAsistencia) {
                await transaction.rollback();
                return ApiResponse.error(res, MENSAJES.ASISTENCIA_YA_REGISTRADA, CODIGOS_HTTP.CONFLICTO);
            }

            const nuevaAsistencia = await AsistenciaService.crear({
                fecha: fechaHoy,
                estado: 'Presente',
                registrado_por: 'asistente',
                inscripcion: inscripcion.id
            }, transaction);

            await transaction.commit();

            return ApiResponse.success(
                res,
                { asistencia: nuevaAsistencia, evento: { titulo: inscripcion.evento.titulo } },
                MENSAJES.CHECKIN_REGISTRADO,
                CODIGOS_HTTP.CREADO
            );
        } catch (error) {
            if (transaction && !transaction.finished) await transaction.rollback();
            next(error);
        }
    }

    _responderError = (res, validacion) => {
        const metodoRespuesta = this._obtenerMetodoRespuesta(validacion.codigoEstado);
        return metodoRespuesta.call(ApiResponse, res, validacion.mensaje);
    }

    _obtenerMetodoRespuesta = (codigo) => {
        const mapeo = {
            [CODIGOS_HTTP.NOT_FOUND]: ApiResponse.notFound,
            [CODIGOS_HTTP.FORBIDDEN]: ApiResponse.forbidden,
            [CODIGOS_HTTP.BAD_REQUEST]: ApiResponse.error
        };
        return mapeo[codigo] || ApiResponse.error;
    }
}

module.exports = new AsistenciaController();