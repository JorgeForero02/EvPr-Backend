const { Evento, Empresa, AdministradorEmpresa, Actividad } = require('../models');

/**
 * Verifica que el usuario pueda crear eventos en una empresa
 * Organizadores y Gerentes: pueden crear si pertenecen a la empresa
 */
const verificarPermisoEvento = async (req, res, next) => {
    try {
        const usuarioId = req.usuario.id;
        const empresaId = req.body.id_empresa;

        // Obtener info del admin de empresa
        const adminEmpresa = await AdministradorEmpresa.findOne({
            where: {
                id_usuario: usuarioId,
                id_empresa: empresaId
            }
        });

        if (!adminEmpresa) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para crear eventos en esta empresa'
            });
        }

        // Guardar en req para usar después
        req.adminEmpresa = adminEmpresa;
        next();

    } catch (error) {
        console.error('Error en verificarPermisoEvento:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos'
        });
    }
};

/**
 * Verifica permisos para EDITAR un evento específico
 * Organizadores: solo pueden editar si son el creador
 * Gerentes: pueden editar cualquier evento de su empresa
 */
const verificarPermisoEdicionEvento = async (req, res, next) => {
    try {
        const usuarioId = req.usuario.id;
        const eventoId = req.params.eventoId;

        // Obtener el evento
        const evento = await Evento.findByPk(eventoId);

        if (!evento) {
            return res.status(404).json({
                success: false,
                message: 'Evento no encontrado'
            });
        }

        // Verificar si es admin de la empresa del evento
        const adminEmpresa = await AdministradorEmpresa.findOne({
            where: {
                id_usuario: usuarioId,
                id_empresa: evento.id_empresa
            }
        });

        if (!adminEmpresa) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para editar eventos de esta empresa'
            });
        }

        // Si es organizador (es_Gerente = false/0), solo puede editar si es creador
        const esGerente = adminEmpresa.es_Gerente === true || adminEmpresa.es_Gerente === 1;

        if (!esGerente && evento.id_creador !== usuarioId) {
            return res.status(403).json({
                success: false,
                message: 'Como organizador, solo puedes editar tus propios eventos'
            });
        }

        req.evento = evento;
        req.adminEmpresa = adminEmpresa;
        next();

    } catch (error) {
        console.error('Error en verificarPermisoEdicionEvento:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos de edición'
        });
    }
};

/**
 * [BACKEND-FIX] B4: Verifica permisos para EDITAR/ELIMINAR una actividad
 * Obtiene la actividad → su evento → verifica que el usuario pertenezca a la empresa del evento
 */
const verificarPermisoActividad = async (req, res, next) => {
    try {
        const usuarioId = req.usuario.id;
        const actividadId = req.params.actividadId;

        const actividad = await Actividad.findByPk(actividadId);

        if (!actividad) {
            return res.status(404).json({
                success: false,
                message: 'Actividad no encontrada'
            });
        }

        const evento = await Evento.findByPk(actividad.id_evento);

        if (!evento) {
            return res.status(404).json({
                success: false,
                message: 'Evento asociado no encontrado'
            });
        }

        const adminEmpresa = await AdministradorEmpresa.findOne({
            where: {
                id_usuario: usuarioId,
                id_empresa: evento.id_empresa
            }
        });

        if (!adminEmpresa) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para modificar actividades de esta empresa'
            });
        }

        req.actividad = actividad;
        req.evento = evento;
        req.adminEmpresa = adminEmpresa;
        next();

    } catch (error) {
        console.error('Error en verificarPermisoActividad:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos de actividad'
        });
    }
};

module.exports = {
    verificarPermisoEvento,
    verificarPermisoEdicionEvento,
    verificarPermisoActividad
};
