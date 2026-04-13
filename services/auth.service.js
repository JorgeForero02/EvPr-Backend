const bcrypt = require('bcryptjs');
const { Usuario, Administrador, Asistente, Ponente, AdministradorEmpresa, Empresa } = require('../models');
const { CODIGOS_HTTP, MENSAJES_AUTH } = require('../constants/auth.constants');
const UsuarioService = require('./usuario.service');

const SALT_ROUNDS = 10;
const ESTADO_ACTIVO = 1;
const ROL_GERENTE = 1;
const ROL_ORGANIZADOR = 0;

class AuthService {
    async registrarUsuario({ nombre, cedula, telefono, correo, contraseña, rol, especialidad }) {
        const hashedPassword = await bcrypt.hash(contraseña, SALT_ROUNDS);

        const nuevoUsuario = await Usuario.create({
            nombre,
            cedula,
            telefono,
            correo,
            contraseña: hashedPassword
        });

        if (rol === 'asistente') {
            await Asistente.create({ id_usuario: nuevoUsuario.id });
        } else if (rol === 'ponente') {
            await Ponente.create({
                id_usuario: nuevoUsuario.id,
                especialidad: especialidad || ''
            });
        }

        return nuevoUsuario;
    }

    async autenticar(correo, contraseña) {
        const usuario = await Usuario.findOne({ where: { correo } });

        if (!usuario) {
            return {
                exito: false,
                mensaje: MENSAJES_AUTH.CREDENCIALES_INVALIDAS,
                codigoEstado: CODIGOS_HTTP.NO_AUTORIZADO
            };
        }

        const passwordValida = await bcrypt.compare(contraseña, usuario.contraseña);

        if (!passwordValida) {
            return {
                exito: false,
                mensaje: MENSAJES_AUTH.CREDENCIALES_INVALIDAS,
                codigoEstado: CODIGOS_HTTP.NO_AUTORIZADO
            };
        }

        if (usuario.activo === 0) {
            return {
                exito: false,
                mensaje: MENSAJES_AUTH.CUENTA_DESHABILITADA,
                codigoEstado: CODIGOS_HTTP.NO_AUTORIZADO
            };
        }

        const { rol, rolData } = await UsuarioService.buscarRolUsuario(usuario.id);

        if (!rol) {
            return {
                exito: false,
                mensaje: MENSAJES_AUTH.SIN_ROL_ASIGNADO,
                codigoEstado: CODIGOS_HTTP.FORBIDDEN
            };
        }

        return {
            exito: true,
            usuario,
            rol,
            rolData
        };
    }

    async promoverAGerente(idUsuario, idEmpresa, usuarioAutenticado) {
        const usuario = await Usuario.findByPk(idUsuario);

        if (!usuario) {
            return {
                exito: false,
                mensaje: MENSAJES_AUTH.USUARIO_NO_ENCONTRADO,
                codigoEstado: CODIGOS_HTTP.NOT_FOUND
            };
        }

        const empresa = await Empresa.findByPk(idEmpresa);

        if (!empresa) {
            return {
                exito: false,
                mensaje: MENSAJES_AUTH.EMPRESA_NO_ENCONTRADA,
                codigoEstado: CODIGOS_HTTP.NOT_FOUND
            };
        }

        const adminEmpresaExistente = await AdministradorEmpresa.findOne({
            where: { id_usuario: idUsuario }
        });

        if (adminEmpresaExistente) {
            return {
                exito: false,
                mensaje: MENSAJES_AUTH.USUARIO_YA_ES_GERENTE,
                codigoEstado: CODIGOS_HTTP.BAD_REQUEST
            };
        }

            await AdministradorEmpresa.create({
                id_usuario: idUsuario,
                id_empresa: idEmpresa,
                es_Gerente: ROL_GERENTE
            });

        return {
            exito: true,
            mensaje: `Usuario ${usuario.nombre} promovido a gerente de ${empresa.nombre}`,
            datos: {
                usuario: {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    correo: usuario.correo
                },
                empresa: {
                    id: empresa.id,
                    nombre: empresa.nombre
                }
            }
        };
    }

    async crearOrganizador({ nombre, cedula, telefono, correo, contraseña, id_empresa }, usuarioAutenticado) {
        const empresa = await Empresa.findByPk(id_empresa);

        if (!empresa) {
            return {
                exito: false,
                mensaje: MENSAJES_AUTH.EMPRESA_NO_ENCONTRADA,
                codigoEstado: CODIGOS_HTTP.NOT_FOUND
            };
        }

        if (usuarioAutenticado.rol === 'gerente') {
            if (usuarioAutenticado.rolData.id_empresa !== id_empresa) {
                return {
                    exito: false,
                    mensaje: MENSAJES_AUTH.GERENTE_SOLO_SU_EMPRESA,
                    codigoEstado: CODIGOS_HTTP.FORBIDDEN
                };
            }
        }

        const usuarioExistente = await UsuarioService.verificarExistencia(correo, cedula);

        if (usuarioExistente.existe) {
            return {
                exito: false,
                mensaje: usuarioExistente.mensaje,
                codigoEstado: CODIGOS_HTTP.BAD_REQUEST
            };
        }

        const hashedPassword = await bcrypt.hash(contraseña, SALT_ROUNDS);

        const nuevoUsuario = await Usuario.create({
            nombre,
            cedula,
            telefono,
            correo,
            contraseña: hashedPassword
        });

            await AdministradorEmpresa.create({
                id_usuario: nuevoUsuario.id,
                id_empresa,
                es_Gerente: 0
            });

        return {
            exito: true,
            mensaje: `Organizador creado exitosamente para ${empresa.nombre}`,
            datos: {
                usuario: {
                    id: nuevoUsuario.id,
                    nombre: nuevoUsuario.nombre,
                    correo: nuevoUsuario.correo
                },
                empresa: {
                    id: empresa.id,
                    nombre: empresa.nombre
                }
            }
        };
    }

    async recuperarContrasena(correo, nuevaContrasena) {
        const usuario = await Usuario.findOne({ where: { correo } });

        if (!usuario) {
            return {
                exito: false,
                mensaje: MENSAJES_AUTH.CORREO_NO_REGISTRADO,
                codigoEstado: CODIGOS_HTTP.NOT_FOUND
            };
        }

        const hashedPassword = await bcrypt.hash(nuevaContrasena, SALT_ROUNDS);
        usuario.contraseña = hashedPassword;
        await usuario.save();

        return { exito: true };
    }

    async crearUsuarioPorAdmin({ nombre, cedula, telefono, correo, contraseña, rol, id_empresa, especialidad }, usuarioAutenticado) {
        const usuarioExistente = await UsuarioService.verificarExistencia(correo, cedula);

        if (usuarioExistente.existe) {
            return {
                exito: false,
                mensaje: usuarioExistente.mensaje,
                codigoEstado: CODIGOS_HTTP.BAD_REQUEST
            };
        }

        if ((rol === 'gerente' || rol === 'organizador') && !id_empresa) {
            return {
                exito: false,
                mensaje: MENSAJES_AUTH.ID_EMPRESA_REQUERIDO,
                codigoEstado: CODIGOS_HTTP.BAD_REQUEST
            };
        }

        const hashedPassword = await bcrypt.hash(contraseña, SALT_ROUNDS);

        const nuevoUsuario = await Usuario.create({
            nombre,
            cedula,
            telefono,
            correo,
            contraseña: hashedPassword
        });

        switch (rol) {
            case 'asistente':
                await Asistente.create({ id_usuario: nuevoUsuario.id });
                break;

            case 'ponente':
                await Ponente.create({
                    id_usuario: nuevoUsuario.id,
                    especialidad: especialidad || ''
                });
                break;

            case 'gerente':
                    await AdministradorEmpresa.create({
                        id_usuario: nuevoUsuario.id,
                        id_empresa,
                        es_Gerente: 1
                    });
                break;

            case 'organizador':
                    await AdministradorEmpresa.create({
                        id_usuario: nuevoUsuario.id,
                        id_empresa,
                        es_Gerente: 0
                    });
                break;
        }

        return {
            exito: true,
            mensaje: `Usuario creado exitosamente como ${rol}`,
            datos: {
                id: nuevoUsuario.id,
                nombre: nuevoUsuario.nombre,
                correo: nuevoUsuario.correo,
                rol
            }
        };
    }
}

module.exports = new AuthService();
