const {
    Usuario,
    Administrador,
    AdministradorEmpresa,
    Ponente,
    Asistente,
    Inscripcion,
    Asistencia,
    Evento,
    Encuesta,
    RespuestaEncuesta,
    RolSistema,
    sequelize
} = require('../models');
const { Op } = require('sequelize');
const AuditoriaService = require('../services/auditoriaService');

const ROLES_SISTEMA_DEFAULT = [
    { tipo: 'gerente', nombre: 'Gerente', descripcion: 'Gestiona la empresa, ubicaciones y lugares.' },
    { tipo: 'organizador', nombre: 'Organizador', descripcion: 'Crea y gestiona eventos de la empresa.' },
    { tipo: 'ponente', nombre: 'Ponente', descripcion: 'Experto invitado asignado a actividades del evento.' },
    { tipo: 'asistente', nombre: 'Asistente', descripcion: 'Usuario final que se inscribe y participa en eventos.' }
];

async function _inicializarRolesSiNecesario() {
    try {
        const count = await RolSistema.count();
        if (count === 0) {
            await RolSistema.bulkCreate(ROLES_SISTEMA_DEFAULT);
        }
    } catch (_) {
    }
}

class AdminController {
    // RF10/RF13 — Dashboard stats del administrador
    async obtenerDashboardStats(req, res) {
        try {
            const [
                totalUsuarios,
                totalAdmins,
                totalGerentes,
                totalOrganizadores,
                totalPonentes,
                totalAsistentes,
                eventosActivos,
                totalEventosFinalizados,
                totalInscripciones,
                totalEncuestasEnviadas,
                totalEncuestasCompletadas,
                totalEncuestasActivas
            ] = await Promise.all([
                Usuario.count(),
                Administrador.count(),
                AdministradorEmpresa.count({ where: { es_Gerente: 1 } }),
                AdministradorEmpresa.count({ where: { es_Gerente: 0 } }),
                Ponente.count(),
                Asistente.count(),
                Evento.count({ where: { estado: 1 } }),
                Evento.count({ where: { estado: 2 } }),
                Inscripcion.count({ where: { estado: 'Confirmada' } }),
                RespuestaEncuesta.count(),
                RespuestaEncuesta.count({ where: { estado: 'completada' } }),
                Encuesta.count({ where: { estado: 'activa' } })
            ]);

            // Tasa global asistencia: asistencias registradas / inscripciones confirmadas
            const totalAsistencias = await Asistencia.count();
            const tasaGlobalAsistencia = totalInscripciones > 0
                ? Math.round((totalAsistencias / totalInscripciones) * 100)
                : 0;

            const tasaRespuestaEncuestas = totalEncuestasEnviadas > 0
                ? Math.round((totalEncuestasCompletadas / totalEncuestasEnviadas) * 100)
                : 0;

            return res.json({
                success: true,
                data: {
                    usuarios_por_rol: {
                        administrador: totalAdmins,
                        gerente: totalGerentes,
                        organizador: totalOrganizadores,
                        ponente: totalPonentes,
                        asistente: totalAsistentes,
                        total: totalUsuarios
                    },
                    eventos_activos: eventosActivos,
                    eventos_finalizados: totalEventosFinalizados,
                    total_inscripciones_confirmadas: totalInscripciones,
                    total_asistencias: totalAsistencias,
                    tasa_global_asistencia: tasaGlobalAsistencia,
                    encuestas: {
                        activas: totalEncuestasActivas,
                        total_enviadas: totalEncuestasEnviadas,
                        total_completadas: totalEncuestasCompletadas,
                        tasa_respuesta: tasaRespuestaEncuestas
                    }
                }
            });
        } catch (error) {
            console.error('Error al obtener stats del dashboard:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas del dashboard'
            });
        }
    }

    async listarRoles(req, res) {
        try {
            await _inicializarRolesSiNecesario();

            const [rolesDB, cntGerentes, cntOrganizadores, cntPonentes, cntAsistentes] = await Promise.all([
                RolSistema.findAll({ order: [['id', 'ASC']] }),
                AdministradorEmpresa.count({
                    where: { es_Gerente: 1 },
                    include: [{ model: Usuario, as: 'usuario', where: { activo: 1 }, attributes: [] }]
                }),
                AdministradorEmpresa.count({
                    where: { es_Gerente: 0 },
                    include: [{ model: Usuario, as: 'usuario', where: { activo: 1 }, attributes: [] }]
                }),
                Ponente.count({
                    include: [{ model: Usuario, as: 'usuario', where: { activo: 1 }, attributes: [] }]
                }),
                Asistente.count({
                    include: [{ model: Usuario, as: 'usuario', where: { activo: 1 }, attributes: [] }]
                })
            ]);

            const usuariosPorRol = {
                gerente: cntGerentes,
                organizador: cntOrganizadores,
                ponente: cntPonentes,
                asistente: cntAsistentes
            };

            const roles = rolesDB.map(r => ({
                id: r.id,
                tipo: r.tipo,
                nombre: r.nombre,
                descripcion: r.descripcion,
                activo: r.activo === 1,
                usuarios_activos: usuariosPorRol[r.tipo] ?? 0
            }));

            return res.json({ success: true, data: roles });
        } catch (error) {
            console.error('Error al listar roles:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener roles' });
        }
    }

    async crearRol(req, res) {
        try {
            const { tipo, nombre, descripcion } = req.body;
            const usuario = req.usuario;

            if (!tipo || !nombre) {
                return res.status(400).json({ success: false, message: 'Los campos tipo y nombre son obligatorios' });
            }

            const existe = await RolSistema.findOne({ where: { tipo } });
            if (existe) {
                return res.status(409).json({ success: false, message: `Ya existe un rol con el tipo "${tipo}"` });
            }

            const rol = await RolSistema.create({ tipo, nombre, descripcion: descripcion || null, activo: 1 });

            await AuditoriaService.registrar({
                mensaje: `Nuevo rol creado: "${nombre}" (${tipo})`,
                tipo: 'POST',
                accion: 'crear_rol',
                usuario: { id: usuario.id, nombre: usuario.nombre }
            });

            return res.status(201).json({ success: true, message: 'Rol creado exitosamente', data: rol });
        } catch (error) {
            console.error('Error al crear rol:', error);
            return res.status(500).json({ success: false, message: 'Error al crear el rol' });
        }
    }

    async toggleRolEstado(req, res) {
        try {
            await _inicializarRolesSiNecesario();

            const { tipo } = req.params;
            const { activo } = req.body;
            const usuario = req.usuario;

            const rol = await RolSistema.findOne({ where: { tipo } });
            if (!rol) {
                return res.status(404).json({ success: false, message: 'Rol no encontrado' });
            }

            const nuevoEstado = activo === true || activo === 1;

            if (!nuevoEstado) {
                let usuariosActivos = 0;
                if (tipo === 'gerente') {
                    usuariosActivos = await AdministradorEmpresa.count({
                        where: { es_Gerente: 1 },
                        include: [{ model: Usuario, as: 'usuario', where: { activo: 1 }, attributes: [] }]
                    });
                } else if (tipo === 'organizador') {
                    usuariosActivos = await AdministradorEmpresa.count({
                        where: { es_Gerente: 0 },
                        include: [{ model: Usuario, as: 'usuario', where: { activo: 1 }, attributes: [] }]
                    });
                } else if (tipo === 'ponente') {
                    usuariosActivos = await Ponente.count({
                        include: [{ model: Usuario, as: 'usuario', where: { activo: 1 }, attributes: [] }]
                    });
                } else if (tipo === 'asistente') {
                    usuariosActivos = await Asistente.count({
                        include: [{ model: Usuario, as: 'usuario', where: { activo: 1 }, attributes: [] }]
                    });
                }

                if (usuariosActivos > 0) {
                    return res.status(409).json({
                        success: false,
                        message: `No se puede deshabilitar el rol "${tipo}": tiene ${usuariosActivos} usuario(s) activo(s). Reasigne o desactive esos usuarios primero.`,
                        usuarios_activos: usuariosActivos
                    });
                }
            }

            await rol.update({ activo: nuevoEstado ? 1 : 0 });

            await AuditoriaService.registrar({
                mensaje: `Rol "${tipo}" ${nuevoEstado ? 'habilitado' : 'deshabilitado'} por el administrador`,
                tipo: 'PATCH',
                accion: 'toggle_rol_estado',
                usuario: { id: usuario.id, nombre: usuario.nombre }
            });

            return res.json({
                success: true,
                message: `Rol "${tipo}" ${nuevoEstado ? 'habilitado' : 'deshabilitado'} exitosamente`,
                data: { tipo, activo: nuevoEstado }
            });
        } catch (error) {
            console.error('Error al cambiar estado de rol:', error);
            return res.status(500).json({ success: false, message: 'Error al actualizar rol' });
        }
    }

    async exportarDashboardCSV(req, res) {
        try {
            const [
                totalUsuarios, totalAdmins, totalGerentes, totalOrganizadores,
                totalPonentes, totalAsistentes, eventosActivos, totalEventosFinalizados,
                totalInscripciones, totalEncuestasEnviadas, totalEncuestasCompletadas, totalEncuestasActivas
            ] = await Promise.all([
                Usuario.count(), Administrador.count(),
                AdministradorEmpresa.count({ where: { es_Gerente: 1 } }),
                AdministradorEmpresa.count({ where: { es_Gerente: 0 } }),
                Ponente.count(), Asistente.count(),
                Evento.count({ where: { estado: 1 } }),
                Evento.count({ where: { estado: 2 } }),
                Inscripcion.count({ where: { estado: 'Confirmada' } }),
                RespuestaEncuesta.count(),
                RespuestaEncuesta.count({ where: { estado: 'completada' } }),
                Encuesta.count({ where: { estado: 'activa' } })
            ]);

            const totalAsistencias = await Asistencia.count();
            const tasaAsistencia = totalInscripciones > 0
                ? Math.round((totalAsistencias / totalInscripciones) * 100) : 0;
            const tasaEncuestas = totalEncuestasEnviadas > 0
                ? Math.round((totalEncuestasCompletadas / totalEncuestasEnviadas) * 100) : 0;

            const filas = [
                ['Métrica', 'Valor'],
                ['Total Usuarios', totalUsuarios],
                ['Administradores', totalAdmins],
                ['Gerentes', totalGerentes],
                ['Organizadores', totalOrganizadores],
                ['Ponentes', totalPonentes],
                ['Asistentes', totalAsistentes],
                ['Eventos Activos', eventosActivos],
                ['Eventos Finalizados', totalEventosFinalizados],
                ['Inscripciones Confirmadas', totalInscripciones],
                ['Total Asistencias', totalAsistencias],
                ['Tasa Global de Asistencia (%)', tasaAsistencia],
                ['Encuestas Activas', totalEncuestasActivas],
                ['Encuestas Enviadas', totalEncuestasEnviadas],
                ['Encuestas Completadas', totalEncuestasCompletadas],
                ['Tasa de Respuesta Encuestas (%)', tasaEncuestas]
            ];

            const csv = filas.map(f => f.join(',')).join('\n');
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename="dashboard_admin.csv"');
            return res.send('\uFEFF' + csv);
        } catch (error) {
            console.error('Error al exportar dashboard CSV:', error);
            return res.status(500).json({ success: false, message: 'Error al exportar CSV' });
        }
    }
}

module.exports = new AdminController();
