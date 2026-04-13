const { Actividad, Evento, Lugar } = require('../models');

class PermisosService {
    // ==========================================
    // PERMISOS PARA ACTIVIDADES
    // ==========================================

    async verificarPermisoEscritura(usuario, actividadId) {
        const { ROLES_USUARIO, MENSAJES_PERMISOS, CODIGOS_HTTP } = require('../constants/actividad.constants');

        const actividad = await Actividad.findByPk(actividadId, {
            include: {
                model: Evento,
                as: 'evento',
                attributes: ['id', 'id_empresa', 'id_creador']
            }
        });

        if (!actividad) {
            return {
                tienePermiso: false,
                codigoEstado: CODIGOS_HTTP.NOT_FOUND,
                mensaje: MENSAJES_PERMISOS.ACTIVIDAD_NO_ENCONTRADA
            };
        }

        const evento = actividad.evento;

        if (usuario.rol === ROLES_USUARIO.ADMINISTRADOR) {
            return { tienePermiso: true, actividad, evento };
        }

        if (usuario.rolData.id_empresa !== evento.id_empresa) {
            return {
                tienePermiso: false,
                codigoEstado: CODIGOS_HTTP.FORBIDDEN,
                mensaje: MENSAJES_PERMISOS.SIN_ACCESO_EMPRESA
            };
        }

        if (usuario.rol === ROLES_USUARIO.GERENTE) {
            return { tienePermiso: true, actividad, evento };
        }

        if (usuario.rol === ROLES_USUARIO.ORGANIZADOR && evento.id_creador !== usuario.id) {
            return {
                tienePermiso: false,
                codigoEstado: CODIGOS_HTTP.FORBIDDEN,
                mensaje: MENSAJES_PERMISOS.ORGANIZADOR_SOLO_PROPIOS
            };
        }

        return { tienePermiso: true, actividad, evento };
    }

    async verificarPermisoLectura(usuario, actividadId) {
        const { ROLES_USUARIO, MENSAJES_PERMISOS, CODIGOS_HTTP } = require('../constants/actividad.constants');

        const actividad = await Actividad.findByPk(actividadId, {
            include: [
                {
                    model: Evento,
                    as: 'evento',
                    attributes: ['id', 'titulo', 'modalidad', 'id_empresa']
                },
                {
                    model: Lugar,
                    as: 'lugares',
                    attributes: ['id', 'nombre', 'descripcion'],
                    through: { attributes: [] }
                }
            ]
        });

        if (!actividad) {
            return {
                tienePermiso: false,
                codigoEstado: CODIGOS_HTTP.NOT_FOUND,
                mensaje: MENSAJES_PERMISOS.ACTIVIDAD_NO_ENCONTRADA
            };
        }

        const rolesPermitidos = [
            ROLES_USUARIO.ADMINISTRADOR,
            ROLES_USUARIO.ASISTENTE,
            ROLES_USUARIO.PONENTE
        ];

        if (rolesPermitidos.includes(usuario.rol)) {
            return { tienePermiso: true, actividad };
        }

        if (usuario.rolData.id_empresa !== actividad.evento.id_empresa) {
            return {
                tienePermiso: false,
                codigoEstado: CODIGOS_HTTP.FORBIDDEN,
                mensaje: MENSAJES_PERMISOS.SIN_PERMISO_VER
            };
        }

        return { tienePermiso: true, actividad };
    }

    // ==========================================
    // PERMISOS PARA EVENTOS (ASISTENCIAS)
    // ==========================================

    verificarPermisoLecturaEvento(usuario, evento) {
        const { ROLES_USUARIO } = require('../constants/asistencia.constants');

        const esCreador = evento.id_creador === usuario.id;
        const esAdminEmpresa = usuario.rolData?.id_empresa === evento.id_empresa;
        const esAdministrador = usuario.rol === ROLES_USUARIO.ADMINISTRADOR;

        return esCreador || esAdminEmpresa || esAdministrador;
    }

    verificarPermisoEscrituraEvento(usuario, evento) {
        const { ROLES_USUARIO } = require('../constants/asistencia.constants');

        const esCreador = evento.id_creador === usuario.id;
        const esGerente = usuario.rol === ROLES_USUARIO.GERENTE &&
            usuario.rolData?.id_empresa === evento.id_empresa;
        const esAdministrador = usuario.rol === ROLES_USUARIO.ADMINISTRADOR;

        return esCreador || esGerente || esAdministrador;
    }

    // ==========================================
    // PERMISOS PARA EMPRESAS
    // ==========================================

    verificarAccesoEmpresa(rol, idEmpresaUsuario, idEmpresa) {
        if (rol === 'administrador') return true;
        if ((rol === 'gerente' || rol === 'organizador') && idEmpresaUsuario === parseInt(idEmpresa)) {
            return true;
        }
        return false;
    }

    verificarPermisoActualizarEmpresa(rol, rolData, idEmpresa) {
        if (rol === 'organizador') {
            return {
                tienePermiso: false,
                mensaje: 'Los organizadores no pueden actualizar información de la empresa. Contacte a su gerente.'
            };
        }

        if (rol === 'gerente' && rolData.id_empresa !== parseInt(idEmpresa)) {
            return {
                tienePermiso: false,
                mensaje: 'No tiene permisos para actualizar esta empresa'
            };
        }

        return { tienePermiso: true };
    }

}

module.exports = new PermisosService();
