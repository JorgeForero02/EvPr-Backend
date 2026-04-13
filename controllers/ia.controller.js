const IAService = require('../services/ia.service');
const { Evento, Actividad } = require('../models');

class IAController {
    async generarMensaje(req, res) {
        try {
            const { id_evento, tipo_mensaje, contexto_adicional } = req.body;
            const usuario = req.usuario;

            if (!id_evento || !tipo_mensaje) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requieren id_evento y tipo_mensaje'
                });
            }

            const tiposValidos = ['recordatorio', 'modificacion', 'cancelacion', 'bienvenida', 'general'];
            if (!tiposValidos.includes(tipo_mensaje)) {
                return res.status(400).json({
                    success: false,
                    message: `tipo_mensaje debe ser uno de: ${tiposValidos.join(', ')}`
                });
            }

            const evento = await Evento.findByPk(id_evento, {
                include: [{ model: Actividad, as: 'actividades', attributes: ['titulo'] }]
            });

            if (!evento) {
                return res.status(404).json({ success: false, message: 'Evento no encontrado' });
            }

            const puedeGestionar = usuario.rol === 'administrador' ||
                (usuario.rolData?.id_empresa && usuario.rolData.id_empresa === evento.id_empresa);
            if (!puedeGestionar) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para gestionar este evento'
                });
            }

            const texto = await IAService.generarMensaje({
                evento: {
                    titulo: evento.titulo,
                    fecha_inicio: evento.fecha_inicio,
                    fecha_fin: evento.fecha_fin,
                    modalidad: evento.modalidad,
                    descripcion: evento.descripcion,
                    actividades: evento.actividades || []
                },
                tipo_mensaje,
                contexto_adicional: contexto_adicional || null
            });

            return res.json({
                success: true,
                message: 'Texto generado exitosamente',
                data: {
                    texto_generado: texto,
                    tipo_mensaje,
                    id_evento
                }
            });
        } catch (error) {
            if (error.status === 401 || (error.message && error.message.includes('API'))) {
                return res.status(503).json({
                    success: false,
                    message: 'El servicio de IA no está disponible en este momento'
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Error al generar el mensaje',
                error: error.message
            });
        }
    }

    async generarDescripcion(req, res) {
        try {
            const { id_evento, tono } = req.body;
            const usuario = req.usuario;

            if (!id_evento) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere id_evento'
                });
            }

            const tonosValidos = ['formal', 'amigable', 'motivador'];
            const tonoFinal = tonosValidos.includes(tono) ? tono : 'formal';

            const evento = await Evento.findByPk(id_evento, {
                include: [{ model: Actividad, as: 'actividades', attributes: ['titulo'] }]
            });

            if (!evento) {
                return res.status(404).json({ success: false, message: 'Evento no encontrado' });
            }

            const puedeGestionar = usuario.rol === 'administrador' ||
                (usuario.rolData?.id_empresa && usuario.rolData.id_empresa === evento.id_empresa);
            if (!puedeGestionar) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para gestionar este evento'
                });
            }

            const descripcion = await IAService.generarDescripcion({
                evento: {
                    titulo: evento.titulo,
                    fecha_inicio: evento.fecha_inicio,
                    modalidad: evento.modalidad,
                    cupos: evento.cupos,
                    descripcion_actual: evento.descripcion,
                    actividades: evento.actividades || []
                },
                tono: tonoFinal
            });

            return res.json({
                success: true,
                message: 'Descripción generada exitosamente',
                data: {
                    descripcion_generada: descripcion,
                    tono: tonoFinal,
                    id_evento
                }
            });
        } catch (error) {
            if (error.status === 401 || (error.message && error.message.includes('API'))) {
                return res.status(503).json({
                    success: false,
                    message: 'El servicio de IA no está disponible en este momento'
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Error al generar la descripción',
                error: error.message
            });
        }
    }

    async planificarEvento(req, res) {
        try {
            const { mensaje, historial = [], contexto = {} } = req.body;

            if (!mensaje || typeof mensaje !== 'string' || mensaje.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere un mensaje'
                });
            }

            if (mensaje.trim().length > 1000) {
                return res.status(400).json({
                    success: false,
                    message: 'El mensaje no puede superar los 1000 caracteres'
                });
            }

            const resultado = await IAService.planificarEvento({
                mensaje: mensaje.trim(),
                historial: Array.isArray(historial) ? historial : [],
                contexto
            });

            return res.json({
                success: true,
                data: resultado
            });
        } catch (error) {
            if (error.status === 401 || (error.message && error.message.includes('API'))) {
                return res.status(503).json({
                    success: false,
                    message: 'El servicio de IA no está disponible en este momento'
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Error al procesar la solicitud de planificación',
                error: error.message
            });
        }
    }
}

module.exports = new IAController();
