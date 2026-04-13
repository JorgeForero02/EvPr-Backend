const { Encuesta, Evento, Actividad, AdministradorEmpresa, PonenteActividad, Ponente } = require('../models');

const validarPermisoLecturaEncuestas = async (req, res, next) => {
    try {
        const usuario = req.usuario;


        if (usuario.rol === 'Administrador' || usuario.rol === 'administrador') {
            return next();
        }

        const adminEmpresa = await AdministradorEmpresa.findOne({
            where: { id_usuario: usuario.id }
        });

        if (!adminEmpresa) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. No estás asociado a ninguna empresa como organizador o gerente.'
            });
        }

        req.adminEmpresa = adminEmpresa;
        next();

    } catch (error) {
        console.error('Error en validarPermisoLecturaEncuestas:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al validar permisos de lectura de encuestas'
        });
    }
};


const validarPermiso = async (req, res, next) => {
    try {
        const { encuestaId } = req.params;
        const usuario = req.usuario;

        const encuesta = await Encuesta.findByPk(encuestaId, {
            include: [
                {
                    model: Evento,
                    as: 'evento',
                    attributes: ['id', 'id_empresa']
                },
                {
                    model: Actividad,
                    as: 'actividad',
                    include: [{
                        model: Evento,
                        as: 'evento',
                        attributes: ['id', 'id_empresa']
                    }]
                }
            ]
        });

        if (!encuesta) {
            return res.status(404).json({
                success: false,
                message: 'Encuesta no encontrada'
            });
        }

        if (usuario.rol === 'Administrador' || usuario.rol === 'administrador') {
            req.encuesta = encuesta;
            return next();
        }

        let idEmpresaEvento = null;

        if (encuesta.id_evento && encuesta.evento) {
            idEmpresaEvento = encuesta.evento.id_empresa;
        } else if (encuesta.id_actividad && encuesta.actividad && encuesta.actividad.evento) {
            idEmpresaEvento = encuesta.actividad.evento.id_empresa;
        }

        if (!idEmpresaEvento) {
            return res.status(403).json({
                success: false,
                message: 'No se pudo determinar la empresa propietaria de esta encuesta.'
            });
        }

        const adminEmpresa = await AdministradorEmpresa.findOne({
            where: {
                id_usuario: usuario.id,
                id_empresa: idEmpresaEvento
            }
        });

        const ponente = await Ponente.findOne({
            where: {
                id_usuario: usuario.id
            }
        });

        let ponenteActividad = null;
        if (encuesta.id_actividad && ponente) {
            ponenteActividad = await PonenteActividad.findOne({
                where: {
                    id_actividad: encuesta.id_actividad,
                    id_ponente: ponente.id_ponente        
                }
            });
        }

        if (!adminEmpresa && !ponenteActividad) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para acceder a esta encuesta (pertenece a otra empresa).'
            });
        }

        req.encuesta = encuesta;
        req.adminEmpresa = adminEmpresa;
        next();

    } catch (error) {
        console.error('Error en validarPermisoEstadisticas:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al validar permisos de la encuesta'
        });
    }
};

const validarPermisoCreacionEncuesta = async (req, res, next) => {
    try {
        const { id_evento, id_actividad } = req.body;
        const usuario = req.usuario;

        if (!id_evento) {
            return res.status(400).json({
                success: false,
                message: 'El id_evento es obligatorio para crear una encuesta.'
            });
        }

        const evento = await Evento.findByPk(id_evento);
        if (!evento) {
            return res.status(404).json({ success: false, message: 'El evento especificado no existe.' });
        }

        if (id_actividad) {
            const actividad = await Actividad.findByPk(id_actividad);
            if (!actividad) {
                return res.status(404).json({ success: false, message: 'La actividad especificada no existe.' });
            }
            if (actividad.id_evento != id_evento) {
                return res.status(400).json({
                    success: false,
                    message: 'La actividad especificada no pertenece al evento seleccionado.'
                });
            }
        }

        if (usuario.rol !== 'Administrador' && usuario.rol !== 'administrador' && usuario.rol !== 'Ponente' && usuario.rol !== 'ponente') {
            const adminEmpresa = await AdministradorEmpresa.findOne({
                where: {
                    id_usuario: usuario.id,
                    id_empresa: evento.id_empresa
                }
            });

            if (!adminEmpresa) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para crear encuestas en este evento (pertenece a otra empresa o no eres ponente de la actividad).'
                });
            }
        }

        if (usuario.rol === 'Ponente' || usuario.rol === 'ponente') {
            const ponente = await Ponente.findOne({
                where: {
                    id_usuario: usuario.id
                }
            });
            
            const ponenteActividad = await PonenteActividad.findOne({
                where: {
                    id_actividad: id_actividad,
                    id_ponente: ponente.id_ponente        
                }
            });
        
            if (!ponenteActividad) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para crear encuestas en esta actividad (no eres ponente de la actividad).'
                });
            }
        }

        next();

    } catch (error) {
        console.error('Error en validarPermisoCreacionEncuesta:', error);
        return res.status(500).json({ success: false, message: 'Error al validar creación de encuesta' });
    }
};

module.exports = {
    validarPermisoLecturaEncuestas,
    validarPermiso,
    validarPermisoCreacionEncuesta
};