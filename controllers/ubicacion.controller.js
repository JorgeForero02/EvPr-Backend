const UbicacionService = require('../services/ubicacion.service');
const UbicacionValidator = require('../validators/ubicacion.validator');
const PermisosService = require('../services/permisos.service');
const AuditoriaService = require('../services/auditoriaService');
const { MENSAJES } = require('../constants/ubicacion.constants');

class UbicacionController {
    async crearUbicacion(req, res) {
        const transaction = await UbicacionService.crearTransaccion();
        try {
            const { empresaId } = req.params;
            const { lugar, direccion, descripcion, id_ciudad } = req.body;
            const usuario = req.usuario;

            const tienePermiso = PermisosService.verificarAccesoEmpresa(
                usuario.rol,
                usuario.rolData?.id_empresa,
                empresaId
            );

            if (!tienePermiso) {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: MENSAJES.SIN_PERMISO_CREAR
                });
            }

            const validacion = await UbicacionValidator.validarCreacion({
                direccion,
                id_ciudad,
                empresaId
            });

            if (!validacion.esValida) {
                await transaction.rollback();
                return res.status(validacion.codigoEstado || 400).json({
                    success: false,
                    message: validacion.mensaje
                });
            }

            const resultado = await UbicacionService.crear({
                id_empresa: empresaId,
                lugar,
                direccion,
                descripcion,
                id_ciudad
            }, transaction);

            await AuditoriaService.registrar({
                mensaje: `Se creó la ubicación: ${direccion} para empresa ${resultado.empresa.nombre}`,
                tipo: 'POST',
                accion: 'crear_ubicacion',
                usuario: { id: usuario.id, nombre: usuario.nombre }
            });

            await transaction.commit();

            return res.status(201).json({
                success: true,
                message: MENSAJES.CREADA,
                data: resultado.ubicacion
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error al crear ubicación:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_CREAR,
                error: error.message
            });
        }
    }

    async obtenerUbicacionesEmpresa(req, res) {
        try {
            const { empresaId } = req.params;
            const usuario = req.usuario;

            const tienePermiso = PermisosService.verificarAccesoEmpresa(
                usuario.rol,
                usuario.rolData?.id_empresa,
                empresaId
            );

            if (!tienePermiso) {
                return res.status(403).json({
                    success: false,
                    message: MENSAJES.SIN_PERMISO_VER
                });
            }

            const resultado = await UbicacionService.obtenerPorEmpresa(empresaId);

            if (!resultado.exito) {
                return res.status(404).json({
                    success: false,
                    message: resultado.mensaje
                });
            }

            return res.json({
                success: true,
                message: MENSAJES.LISTA_OBTENIDA,
                total: resultado.ubicaciones.length,
                data: resultado.ubicaciones
            });
        } catch (error) {
            console.error('Error al obtener ubicaciones:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_OBTENER,
                error: error.message
            });
        }
    }

    async obtenerUbicacionById(req, res) {
        try {
            const { ubicacionId } = req.params;
            const usuario = req.usuario;

            const ubicacion = await UbicacionService.buscarPorId(ubicacionId);

            if (!ubicacion) {
                return res.status(404).json({
                    success: false,
                    message: MENSAJES.NO_ENCONTRADA
                });
            }

            const tienePermiso = PermisosService.verificarAccesoEmpresa(
                usuario.rol,
                usuario.rolData?.id_empresa,
                ubicacion.id_empresa
            );

            if (!tienePermiso) {
                return res.status(403).json({
                    success: false,
                    message: MENSAJES.SIN_PERMISO_VER
                });
            }

            return res.json({
                success: true,
                message: MENSAJES.OBTENIDA,
                data: ubicacion
            });
        } catch (error) {
            console.error('Error al obtener ubicación:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_OBTENER,
                error: error.message
            });
        }
    }

    async actualizarUbicacion(req, res) {
        const transaction = await UbicacionService.crearTransaccion();
        try {
            const { ubicacionId } = req.params;
            const { lugar, direccion, descripcion } = req.body;
            const usuario = req.usuario;

            const ubicacion = await UbicacionService.buscarPorId(ubicacionId, transaction);

            if (!ubicacion) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: MENSAJES.NO_ENCONTRADA
                });
            }

            const tienePermiso = PermisosService.verificarAccesoEmpresa(
                usuario.rol,
                usuario.rolData?.id_empresa,
                ubicacion.id_empresa
            );

            if (!tienePermiso) {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: MENSAJES.SIN_PERMISO_MODIFICAR
                });
            }

            const actualizaciones = UbicacionService.construirActualizaciones({
                lugar,
                direccion,
                descripcion
            });

            await ubicacion.update(actualizaciones, { transaction });

            await AuditoriaService.registrar({
                mensaje: `Se actualizó la ubicación: ${ubicacion.direccion}`,
                tipo: 'PUT',
                accion: 'actualizar_ubicacion',
                usuario: { id: usuario.id, nombre: usuario.nombre }
            });

            await transaction.commit();

            return res.json({
                success: true,
                message: MENSAJES.ACTUALIZADA,
                data: ubicacion
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error al actualizar ubicación:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_ACTUALIZAR,
                error: error.message
            });
        }
    }

    async toggleEstadoUbicacion(req, res) {
        const transaction = await UbicacionService.crearTransaccion();
        try {
            const { ubicacionId } = req.params;
            const usuario = req.usuario;

            const ubicacion = await UbicacionService.buscarPorId(ubicacionId, transaction);
            if (!ubicacion) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: MENSAJES.NO_ENCONTRADA });
            }

            const tienePermiso = PermisosService.verificarAccesoEmpresa(
                usuario.rol, usuario.rolData?.id_empresa, ubicacion.id_empresa
            );
            if (!tienePermiso) {
                await transaction.rollback();
                return res.status(403).json({ success: false, message: MENSAJES.SIN_PERMISO_TOGGLE });
            }

            const resultado = await UbicacionService.toggleEstado(ubicacionId, transaction);
            if (!resultado.exito) {
                await transaction.rollback();
                return res.status(resultado.codigoEstado || 400).json({ success: false, message: resultado.mensaje });
            }

            await AuditoriaService.registrar({
                mensaje: `Ubicación ${ubicacion.direccion} ${resultado.habilitada ? 'habilitada' : 'deshabilitada'}`,
                tipo: 'PUT',
                accion: resultado.habilitada ? 'habilitar_ubicacion' : 'deshabilitar_ubicacion',
                usuario: { id: usuario.id, nombre: usuario.nombre }
            });

            await transaction.commit();
            const mensaje = resultado.habilitada ? MENSAJES.HABILITADA : MENSAJES.DESHABILITADA;
            return res.json({ success: true, message: mensaje, data: resultado.ubicacion });
        } catch (error) {
            await transaction.rollback();
            console.error('Error al cambiar estado de ubicación:', error);
            return res.status(500).json({ success: false, message: MENSAJES.ERROR_TOGGLE, error: error.message });
        }
    }

    async obtenerStatsUbicaciones(req, res) {
        try {
            const { empresaId } = req.params;
            const usuario = req.usuario;

            const tienePermiso = PermisosService.verificarAccesoEmpresa(
                usuario.rol, usuario.rolData?.id_empresa, empresaId
            );
            if (!tienePermiso) {
                return res.status(403).json({ success: false, message: MENSAJES.SIN_PERMISO_VER });
            }

            const resultado = await UbicacionService.obtenerStats(empresaId);
            if (!resultado.exito) {
                return res.status(404).json({ success: false, message: resultado.mensaje });
            }

            return res.json({ success: true, message: 'Estadísticas de ubicaciones obtenidas', data: resultado.stats });
        } catch (error) {
            console.error('Error al obtener stats de ubicaciones:', error);
            return res.status(500).json({ success: false, message: MENSAJES.ERROR_OBTENER, error: error.message });
        }
    }

    async eliminarUbicacion(req, res) {
        const transaction = await UbicacionService.crearTransaccion();
        try {
            const { ubicacionId } = req.params;
            const usuario = req.usuario;

            const ubicacion = await UbicacionService.buscarPorId(ubicacionId, transaction);

            if (!ubicacion) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: MENSAJES.NO_ENCONTRADA
                });
            }

            const tienePermiso = PermisosService.verificarAccesoEmpresa(
                usuario.rol,
                usuario.rolData?.id_empresa,
                ubicacion.id_empresa
            );

            if (!tienePermiso) {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: MENSAJES.SIN_PERMISO_ELIMINAR
                });
            }

            await ubicacion.destroy({ transaction });

            await AuditoriaService.registrar({
                mensaje: `Se eliminó la ubicación: ${ubicacion.direccion}`,
                tipo: 'DELETE',
                accion: 'eliminar_ubicacion',
                usuario: { id: usuario.id, nombre: usuario.nombre }
            });

            await transaction.commit();

            return res.json({
                success: true,
                message: MENSAJES.ELIMINADA
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error al eliminar ubicación:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_ELIMINAR,
                error: error.message
            });
        }
    }
}

module.exports = new UbicacionController();
