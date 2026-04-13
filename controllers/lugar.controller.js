const LugarService = require('../services/lugar.service');
const LugarValidator = require('../validators/lugar.validator');
const PermisosService = require('../services/permisos.service');
const AuditoriaService = require('../services/auditoriaService');
const { MENSAJES } = require('../constants/lugar.constants');

class LugarController {
    async crearLugar(req, res) {
        const transaction = await LugarService.crearTransaccion();
        try {
            const { empresaId } = req.params;
            const { nombre, descripcion, id_ubicacion, capacidad } = req.body;
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

            const validacion = await LugarValidator.validarCreacion(
                { nombre, descripcion, id_ubicacion, capacidad },
                empresaId
            );

            if (!validacion.esValida) {
                await transaction.rollback();
                return res.status(validacion.codigoEstado || 400).json({
                    success: false,
                    message: validacion.mensaje
                });
            }

            const resultado = await LugarService.crear({
                id_empresa: empresaId,
                nombre,
                descripcion,
                id_ubicacion,
                capacidad
            }, transaction);

            await AuditoriaService.registrar({
                mensaje: `Se creó el lugar: ${nombre} para empresa ${resultado.empresa.nombre}`,
                tipo: 'POST',
                accion: 'crear_lugar',
                usuario: { id: usuario.id, nombre: usuario.nombre }
            });

            await transaction.commit();

            return res.status(201).json({
                success: true,
                message: MENSAJES.CREADO,
                data: resultado.lugar
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error al crear lugar:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_CREAR,
                error: error.message
            });
        }
    }

    async obtenerLugaresEmpresa(req, res) {
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

            const resultado = await LugarService.obtenerPorEmpresa(empresaId);

            if (!resultado.exito) {
                return res.status(404).json({
                    success: false,
                    message: resultado.mensaje
                });
            }

            return res.json({
                success: true,
                message: MENSAJES.LISTA_OBTENIDA,
                total: resultado.lugares.length,
                data: resultado.lugares
            });
        } catch (error) {
            console.error('Error al obtener lugares:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_OBTENER,
                error: error.message
            });
        }
    }

    async obtenerLugarById(req, res) {
        try {
            const { lugarId } = req.params;
            const usuario = req.usuario;

            const lugar = await LugarService.buscarPorId(lugarId);

            if (!lugar) {
                return res.status(404).json({
                    success: false,
                    message: MENSAJES.NO_ENCONTRADO
                });
            }

            const tienePermiso = PermisosService.verificarAccesoEmpresa(
                usuario.rol,
                usuario.rolData?.id_empresa,
                lugar.id_empresa
            );

            if (!tienePermiso) {
                return res.status(403).json({
                    success: false,
                    message: MENSAJES.SIN_PERMISO_VER
                });
            }

            return res.json({
                success: true,
                message: MENSAJES.OBTENIDO,
                data: lugar
            });
        } catch (error) {
            console.error('Error al obtener lugar:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_OBTENER,
                error: error.message
            });
        }
    }

    async actualizarLugar(req, res) {
        const transaction = await LugarService.crearTransaccion();
        try {
            const { lugarId } = req.params;
            const { nombre, descripcion, capacidad } = req.body;
            const usuario = req.usuario;

            const lugar = await LugarService.buscarPorId(lugarId, transaction);

            if (!lugar) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: MENSAJES.NO_ENCONTRADO
                });
            }

            const tienePermiso = PermisosService.verificarAccesoEmpresa(
                usuario.rol,
                usuario.rolData?.id_empresa,
                lugar.id_empresa
            );

            if (!tienePermiso) {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: MENSAJES.SIN_PERMISO_MODIFICAR
                });
            }

            const actualizaciones = LugarService.construirActualizaciones({
                nombre,
                descripcion,
                capacidad
            });

            await lugar.update(actualizaciones, { transaction });

            await AuditoriaService.registrar({
                mensaje: `Se actualizó el lugar: ${lugar.nombre}`,
                tipo: 'PUT',
                accion: 'actualizar_lugar',
                usuario: { id: usuario.id, nombre: usuario.nombre }
            });

            await transaction.commit();

            return res.json({
                success: true,
                message: MENSAJES.ACTUALIZADO,
                data: lugar
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error al actualizar lugar:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_ACTUALIZAR,
                error: error.message
            });
        }
    }

    async toggleEstadoLugar(req, res) {
        const transaction = await LugarService.crearTransaccion();
        try {
            const { lugarId } = req.params;
            const usuario = req.usuario;

            const lugar = await LugarService.buscarPorId(lugarId, transaction);
            if (!lugar) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: MENSAJES.NO_ENCONTRADO });
            }

            const tienePermiso = PermisosService.verificarAccesoEmpresa(
                usuario.rol, usuario.rolData?.id_empresa, lugar.id_empresa
            );
            if (!tienePermiso) {
                await transaction.rollback();
                return res.status(403).json({ success: false, message: MENSAJES.SIN_PERMISO_TOGGLE });
            }

            const resultado = await LugarService.toggleEstado(lugarId, transaction);
            if (!resultado.exito) {
                await transaction.rollback();
                return res.status(resultado.codigoEstado || 400).json({
                    success: false,
                    message: resultado.mensaje,
                    eventosBloqueantes: resultado.eventosBloqueantes || []
                });
            }

            await AuditoriaService.registrar({
                mensaje: `Sala ${lugar.nombre} ${resultado.habilitado ? 'habilitada' : 'deshabilitada'}`,
                tipo: 'PUT',
                accion: resultado.habilitado ? 'habilitar_sala' : 'deshabilitar_sala',
                usuario: { id: usuario.id, nombre: usuario.nombre }
            });

            await transaction.commit();
            const mensaje = resultado.habilitado ? MENSAJES.HABILITADO : MENSAJES.DESHABILITADO;
            return res.json({ success: true, message: mensaje, data: resultado.lugar });
        } catch (error) {
            await transaction.rollback();
            console.error('Error al cambiar estado de sala:', error);
            return res.status(500).json({ success: false, message: MENSAJES.ERROR_TOGGLE, error: error.message });
        }
    }

    async eliminarLugar(req, res) {
        const transaction = await LugarService.crearTransaccion();
        try {
            const { lugarId } = req.params;
            const usuario = req.usuario;

            const lugar = await LugarService.buscarPorId(lugarId, transaction);

            if (!lugar) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: MENSAJES.NO_ENCONTRADO
                });
            }

            const tienePermiso = PermisosService.verificarAccesoEmpresa(
                usuario.rol,
                usuario.rolData?.id_empresa,
                lugar.id_empresa
            );

            if (!tienePermiso) {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: MENSAJES.SIN_PERMISO_ELIMINAR
                });
            }

            const tieneActividades = await LugarService.verificarActividadesAsociadas(lugarId, transaction);

            if (tieneActividades) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: MENSAJES.TIENE_ACTIVIDADES_ASOCIADAS
                });
            }

            await lugar.destroy({ transaction });

            await AuditoriaService.registrar({
                mensaje: `Se eliminó el lugar: ${lugar.nombre}`,
                tipo: 'DELETE',
                accion: 'eliminar_lugar',
                usuario: { id: usuario.id, nombre: usuario.nombre }
            });

            await transaction.commit();

            return res.json({
                success: true,
                message: MENSAJES.ELIMINADO
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error al eliminar lugar:', error);
            return res.status(500).json({
                success: false,
                message: MENSAJES.ERROR_ELIMINAR,
                error: error.message
            });
        }
    }
}

module.exports = new LugarController();
