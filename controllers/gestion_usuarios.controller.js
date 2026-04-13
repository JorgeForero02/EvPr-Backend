const UsuarioService = require('../services/usuario.service');
const UsuarioValidator = require('../validators/usuario.validator');
const PermisosService = require('../services/permisos.service');
const AuditoriaService = require('../services/auditoriaService');
const ApiResponse = require('../utils/response');
const { MENSAJES } = require('../constants/usuario.constants');

class GestionUsuariosController {
    async getUserComplete(req, res, next) {
        try {
            const { id } = req.params;

            const usuario = await UsuarioService.buscarCompletoConRol(id);

            if (!usuario) {
                return ApiResponse.notFound(res, MENSAJES.USUARIO_NO_ENCONTRADO);
            }

            await AuditoriaService.registrar({
                mensaje: `Consulta de información de usuario: ${usuario.nombre}`,
                tipo: 'READ',
                accion: 'consultar_usuario',
                usuario: req.usuario
            });

            return ApiResponse.success(res, usuario, MENSAJES.USUARIO_OBTENIDO);
        } catch (error) {
            next(error);
        }
    }

    async updateProfile(req, res, next) {
        try {
            const { id } = req.params;
            const { nombre, telefono, cedula } = req.body;

            const validacion = await UsuarioValidator.validarActualizacionPerfil(
                { nombre, telefono, cedula },
                id
            );

            if (!validacion.esValida) {
                return ApiResponse.error(res, validacion.mensaje, 400);
            }

            const resultado = await UsuarioService.actualizarPerfil(id, {
                nombre,
                telefono,
                cedula
            });

            if (!resultado.exito) {
                return ApiResponse.notFound(res, resultado.mensaje);
            }

            await AuditoriaService.registrarActualizacion(
                'perfil_usuario',
                id,
                resultado.datosAnteriores,
                resultado.datosNuevos,
                req.usuario
            );

            return ApiResponse.success(res, resultado.usuario, MENSAJES.PERFIL_ACTUALIZADO);
        } catch (error) {
            next(error);
        }
    }

    async updateRoleData(req, res, next) {
        try {
            const { id } = req.params;
            const { rol, roleData } = req.body;

            const resultado = await UsuarioService.actualizarDatosRol(id, rol, roleData);

            if (!resultado.exito) {
                return ApiResponse.notFound(res, resultado.mensaje);
            }

            await AuditoriaService.registrarActualizacion(
                `datos_rol_${rol}`,
                id,
                resultado.datosAnteriores,
                resultado.datosNuevos,
                req.usuario
            );

            return ApiResponse.success(res, resultado.datosActualizados, MENSAJES.ROL_ACTUALIZADO);
        } catch (error) {
            next(error);
        }
    }

    async changeCompany(req, res, next) {
        try {
            const { id } = req.params;
            const { nueva_empresa_id } = req.body;

            if (!nueva_empresa_id) {
                return ApiResponse.error(res, MENSAJES.EMPRESA_ID_REQUERIDO, 400);
            }

            const resultado = await UsuarioService.cambiarEmpresa(id, nueva_empresa_id);

            if (!resultado.exito) {
                return ApiResponse.notFound(res, resultado.mensaje);
            }

            await AuditoriaService.registrar({
                mensaje: `Usuario ID ${id} cambió de empresa ${resultado.empresaAnterior} a ${nueva_empresa_id} (${resultado.empresaNombre})`,
                tipo: 'UPDATE',
                accion: 'cambiar_empresa',
                usuario: req.usuario
            });

            return ApiResponse.success(res, resultado.datos, MENSAJES.EMPRESA_ACTUALIZADA);
        } catch (error) {
            next(error);
        }
    }

    async createUser(req, res, next) {
        try {
            const { nombre, cedula, telefono, correo, contraseña, rol, roleData } = req.body;

            const validacion = UsuarioValidator.validarCreacionUsuario(req.body);
            if (!validacion.esValida) {
                return ApiResponse.error(res, validacion.mensaje, 400);
            }

            const resultado = await UsuarioService.crearUsuario({
                nombre,
                cedula,
                telefono,
                correo,
                contraseña,
                rol,
                roleData
            });

            if (!resultado.exito) {
                return ApiResponse.error(res, resultado.mensaje, 400);
            }

            await AuditoriaService.registrarCreacion('usuario', {
                id: resultado.usuario.id,
                nombre: resultado.usuario.nombre,
                cedula: resultado.usuario.cedula,
                correo: resultado.usuario.correo,
                rol: rol,
                creado_por_admin: true
            }, req.usuario);

            return ApiResponse.success(res, resultado.datos, MENSAJES.USUARIO_CREADO, 201);
        } catch (error) {
            next(error);
        }
    }

    async getAllUsersComplete(req, res, next) {
        try {
            const { nombre, correo, rol, estado } = req.query;
            const filtros = {};
            if (nombre) filtros.nombre = nombre;
            if (correo) filtros.correo = correo;
            if (rol) filtros.rol = rol;
            if (estado !== undefined) filtros.estado = estado;

            const usuarios = await UsuarioService.obtenerTodosCompletos(filtros);

            await AuditoriaService.registrar({
                mensaje: `Consulta de listado completo de usuarios (${usuarios.length} registros)`,
                tipo: 'READ',
                accion: 'listar_usuarios',
                usuario: req.usuario
            });

            return ApiResponse.success(res, usuarios, MENSAJES.USUARIOS_OBTENIDOS);
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req, res, next) {
        try {
            const { id } = req.params;
            const { contraseña_actual, contraseña_nueva } = req.body;

            const validacion = UsuarioValidator.validarCambioContrasena(req.body);
            if (!validacion.esValida) {
                return ApiResponse.error(res, validacion.mensaje, 400);
            }

            const resultado = await UsuarioService.cambiarContrasena(
                id,
                contraseña_actual,
                contraseña_nueva
            );

            if (!resultado.exito) {
                if (resultado.esErrorSeguridad) {
                    await AuditoriaService.registrar({
                        mensaje: `Intento fallido de cambio de contraseña para usuario ID: ${id}`,
                        tipo: 'SECURITY',
                        accion: 'cambio_contraseña_fallido',
                        usuario: req.usuario
                    });
                }

                return ApiResponse.error(res, resultado.mensaje, resultado.codigoEstado || 400);
            }

            await AuditoriaService.registrar({
                mensaje: `Cambio de contraseña exitoso para usuario: ${resultado.nombreUsuario}`,
                tipo: 'SECURITY',
                accion: 'cambio_contraseña_exitoso',
                usuario: req.usuario
            });

            return ApiResponse.success(res, null, MENSAJES.CONTRASENA_ACTUALIZADA);
        } catch (error) {
            next(error);
        }
    }

    async toggleUserStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { activo } = req.body;

            if (req.usuario.id === parseInt(id)) {
                return ApiResponse.error(res, MENSAJES.NO_DESACTIVAR_PROPIA_CUENTA, 400);
            }

            const resultado = await UsuarioService.cambiarEstadoUsuario(id, activo);

            if (!resultado.exito) {
                return ApiResponse.notFound(res, resultado.mensaje);
            }

            const mensaje = activo === 1
                ? `Usuario ${resultado.usuario.nombre} activado exitosamente`
                : `Usuario ${resultado.usuario.nombre} desactivado exitosamente`;

            await AuditoriaService.registrar({
                mensaje: `Usuario ${resultado.usuario.nombre} cambió de estado: ${resultado.estadoAnterior === 1 ? 'ACTIVO' : 'INACTIVO'} → ${activo === 1 ? 'ACTIVO' : 'INACTIVO'}`,
                tipo: 'UPDATE',
                accion: activo === 1 ? 'activar_usuario' : 'desactivar_usuario',
                usuario: req.usuario
            });

            return ApiResponse.success(res, {
                id: resultado.usuario.id,
                nombre: resultado.usuario.nombre,
                correo: resultado.usuario.correo,
                activo: resultado.usuario.activo,
                modificado_por: req.usuario.nombre
            }, mensaje);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new GestionUsuariosController();
