const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { Usuario, Administrador, Asistente, Ponente, AdministradorEmpresa, Empresa } = require('../models');
const { MENSAJES } = require('../constants/usuario.constants');

const SALT_ROUNDS = 10;

class UsuarioService {
    async buscarPorId(id) {
        return await Usuario.findByPk(id, {
            attributes: { exclude: ['contraseña'] }
        });
    }

    async buscarPorCorreo(correo) {
        return await Usuario.findOne({ where: { correo } });
    }

    async buscarPorCedula(cedula) {
        return await Usuario.findOne({ where: { cedula } });
    }

    async verificarExistencia(correo, cedula) {
        const usuarioCorreo = await this.buscarPorCorreo(correo);
        if (usuarioCorreo) {
            return { existe: true, mensaje: MENSAJES.CORREO_YA_REGISTRADO };
        }

        const usuarioCedula = await this.buscarPorCedula(cedula);
        if (usuarioCedula) {
            return { existe: true, mensaje: MENSAJES.CEDULA_YA_REGISTRADA };
        }

        return { existe: false };
    }

    async buscarRolUsuario(usuarioId) {
        const administrador = await Administrador.findOne({
            where: { id_usuario: usuarioId }
        });
        if (administrador) {
            return { rol: 'administrador', rolData: administrador };
        }

        const adminEmpresa = await AdministradorEmpresa.findOne({
            where: { id_usuario: usuarioId },
            include: [{
                model: Empresa,
                as: 'empresa',
                attributes: ['id', 'nombre', 'nit', 'estado']
            }]
        });
        if (adminEmpresa) {
            const rol = adminEmpresa.es_Gerente === 1 ? 'gerente' : 'organizador';
            return { rol, rolData: adminEmpresa };
        }

        const asistente = await Asistente.findOne({
            where: { id_usuario: usuarioId }
        });
        if (asistente) {
            return { rol: 'asistente', rolData: asistente };
        }

        const ponente = await Ponente.findOne({
            where: { id_usuario: usuarioId }
        });
        if (ponente) {
            return { rol: 'ponente', rolData: ponente };
        }

        return { rol: null, rolData: null };
    }

    async buscarRolCompletoUsuario(usuarioId) {
        const administrador = await Administrador.findOne({
            where: { id_usuario: usuarioId }
        });
        if (administrador) {
            return {
                rol: 'administrador',
                rol_id: administrador.id,
                rol_data: null
            };
        }

        const adminEmpresa = await AdministradorEmpresa.findOne({
            where: { id_usuario: usuarioId },
            include: [{
                model: Empresa,
                as: 'empresa',
                attributes: ['id', 'nombre']  // ✅ Cambiado de razon_social a nombre
            }]
        });
        if (adminEmpresa) {
            const esGerente = adminEmpresa.es_Gerente === 1;
            return {
                rol: esGerente ? 'gerente' : 'organizador',
                rol_id: adminEmpresa.id,
                rol_data: {
                    empresa_id: adminEmpresa.id_empresa,
                    empresa_nombre: adminEmpresa.empresa?.nombre,
                    es_gerente: esGerente
                }
            };
        }

        const ponente = await Ponente.findOne({
            where: { id_usuario: usuarioId }
        });
        if (ponente) {
            return {
                rol: 'ponente',
                rol_id: ponente.id_ponente,
                rol_data: {
                    especialidad: ponente.especialidad
                }
            };
        }

        const asistente = await Asistente.findOne({
            where: { id_usuario: usuarioId }
        });
        if (asistente) {
            return {
                rol: 'asistente',
                rol_id: asistente.id_asistente,
                rol_data: null
            };
        }

        return { rol: null, rol_id: null, rol_data: null };
    }

    async buscarCompletoConRol(id) {
        const usuario = await Usuario.findByPk(id, {
            attributes: ['id', 'nombre', 'cedula', 'telefono', 'correo', 'activo']
        });

        if (!usuario) return null;

        const rol = await this.buscarRolCompletoUsuario(id);

        return {
            ...usuario.toJSON(),
            ...rol
        };
    }

    async actualizarPerfil(id, { nombre, telefono, cedula }) {
        const usuario = await Usuario.findByPk(id);

        if (!usuario) {
            return {
                exito: false,
                mensaje: MENSAJES.USUARIO_NO_ENCONTRADO
            };
        }

        const datosAnteriores = { ...usuario.toJSON() };
        await usuario.update({ nombre, telefono, cedula });

        return {
            exito: true,
            usuario,
            datosAnteriores,
            datosNuevos: usuario.toJSON()
        };
    }

    async actualizarDatosRol(id, rol, roleData) {
        let actualizado = null;
        let datosAnteriores = null;

        if (rol === 'ponente') {
            const ponente = await Ponente.findOne({ where: { id_usuario: id } });
            if (ponente) {
                datosAnteriores = { ...ponente.toJSON() };
                actualizado = await ponente.update({ especialidad: roleData.especialidad });
            }
        } else if (rol === 'gerente' || rol === 'organizador') {
            const adminEmpresa = await AdministradorEmpresa.findOne({
                where: { id_usuario: id }
            });
            if (adminEmpresa && roleData.empresa_id) {
                datosAnteriores = { ...adminEmpresa.toJSON() };
                actualizado = await adminEmpresa.update({ id_empresa: roleData.empresa_id });
            }
        }

        if (!actualizado) {
            return {
                exito: false,
                mensaje: MENSAJES.ROL_NO_ENCONTRADO
            };
        }

        return {
            exito: true,
            datosActualizados: actualizado,
            datosAnteriores,
            datosNuevos: actualizado.toJSON()
        };
    }

    async cambiarEmpresa(id, nuevaEmpresaId) {
        const empresa = await Empresa.findByPk(nuevaEmpresaId);
        if (!empresa) {
            return {
                exito: false,
                mensaje: MENSAJES.EMPRESA_NO_ENCONTRADA
            };
        }

        const adminEmpresa = await AdministradorEmpresa.findOne({
            where: { id_usuario: id }
        });

        if (!adminEmpresa) {
            return {
                exito: false,
                mensaje: MENSAJES.USUARIO_SIN_EMPRESA
            };
        }

        const empresaAnterior = adminEmpresa.id_empresa;
        await adminEmpresa.update({ id_empresa: nuevaEmpresaId });

        return {
            exito: true,
            empresaAnterior,
            empresaNombre: empresa.nombre,
            datos: {
                usuario_id: id,
                empresa_anterior: empresaAnterior,
                empresa_nueva: nuevaEmpresaId,
                empresa_nombre: empresa.nombre
            }
        };
    }

    async crearUsuario({ nombre, cedula, telefono, correo, contraseña, rol, roleData }) {
        const usuarioExistente = await this.verificarExistencia(correo, cedula);
        if (usuarioExistente.existe) {
            return {
                exito: false,
                mensaje: usuarioExistente.mensaje
            };
        }

        const contraseñaHash = await bcrypt.hash(contraseña, SALT_ROUNDS);

        const nuevoUsuario = await Usuario.create({
            nombre,
            cedula,
            telefono,
            correo,
            contraseña: contraseñaHash
        });

        const rolCreado = await this._crearRolUsuario(nuevoUsuario.id, rol, roleData);

        return {
            exito: true,
            usuario: nuevoUsuario,
            datos: {
                usuario: nuevoUsuario,
                rol: rolCreado
            }
        };
    }

    async obtenerTodosCompletos(filtros = {}) {
        const where = {};

        if (filtros.nombre) where.nombre = { [Op.like]: `%${filtros.nombre}%` };
        if (filtros.correo) where.correo = { [Op.like]: `%${filtros.correo}%` };
        if (filtros.estado !== undefined && filtros.estado !== '') {
            where.activo = filtros.estado === 'activo' ? 1 : 0;
        }

        const usuarios = await Usuario.findAll({
            where,
            attributes: ['id', 'nombre', 'cedula', 'telefono', 'correo', 'activo']
        });

        const resultados = await Promise.all(
            usuarios.map(async (usuario) => {
                const rol = await this.buscarRolCompletoUsuario(usuario.id);
                return {
                    ...usuario.toJSON(),
                    ...rol
                };
            })
        );

        if (filtros.rol) {
            return resultados.filter(u => u.rol === filtros.rol);
        }

        return resultados;
    }

    async cambiarContrasena(id, contraseñaActual, contraseñaNueva) {
        const usuario = await Usuario.findByPk(id, {
            attributes: ['id', 'nombre', 'correo', 'contraseña']
        });

        if (!usuario) {
            return {
                exito: false,
                mensaje: MENSAJES.USUARIO_NO_ENCONTRADO
            };
        }

        const esValida = await bcrypt.compare(contraseñaActual, usuario.contraseña);
        if (!esValida) {
            return {
                exito: false,
                mensaje: MENSAJES.CONTRASENA_INCORRECTA,
                codigoEstado: 401,
                esErrorSeguridad: true
            };
        }

        const nuevaContraseñaHash = await bcrypt.hash(contraseñaNueva, SALT_ROUNDS);
        await usuario.update({ contraseña: nuevaContraseñaHash });

        return {
            exito: true,
            nombreUsuario: usuario.nombre
        };
    }

    async cambiarEstadoUsuario(id, activo) {
        const usuario = await Usuario.findByPk(id, {
            attributes: ['id', 'nombre', 'correo', 'activo']
        });

        if (!usuario) {
            return {
                exito: false,
                mensaje: MENSAJES.USUARIO_NO_ENCONTRADO
            };
        }

        const estadoAnterior = usuario.activo;
        await usuario.update({ activo });

        return {
            exito: true,
            usuario,
            estadoAnterior
        };
    }

    async _crearRolUsuario(usuarioId, rol, roleData) {
        const rolesCreadores = {
            administrador: () => Administrador.create({ id_usuario: usuarioId }),
            ponente: () => Ponente.create({
                id_usuario: usuarioId,
                especialidad: roleData?.especialidad || null
            }),
            asistente: () => Asistente.create({ id_usuario: usuarioId }),
            organizador: () => AdministradorEmpresa.create({
                id_usuario: usuarioId,
                id_empresa: roleData.empresa_id,
                es_Gerente: 0
            }),
            gerente: () => AdministradorEmpresa.create({
                id_usuario: usuarioId,
                id_empresa: roleData.empresa_id,
                es_Gerente: 1
            })
        };

        const creador = rolesCreadores[rol];
        if (!creador) {
            throw new Error('Rol no válido');
        }

        return await creador();
    }
}

module.exports = new UsuarioService();
