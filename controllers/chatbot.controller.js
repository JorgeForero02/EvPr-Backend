const ChatbotService = require('../services/chatbot.service');

class ChatbotController {
    async consultar(req, res) {
        try {
            const { pregunta, id_evento } = req.body;

            if (!pregunta || typeof pregunta !== 'string' || pregunta.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una pregunta válida'
                });
            }

            if (pregunta.trim().length > 500) {
                return res.status(400).json({
                    success: false,
                    message: 'La pregunta no puede superar los 500 caracteres'
                });
            }

            const respuesta = await ChatbotService.responder({
                pregunta: pregunta.trim(),
                id_evento: id_evento || null
            });

            return res.json({
                success: true,
                data: {
                    pregunta: pregunta.trim(),
                    respuesta
                }
            });
        } catch (error) {
            if (error.status === 401 || (error.message && error.message.includes('API'))) {
                return res.status(503).json({
                    success: false,
                    message: 'El servicio de chatbot no está disponible en este momento'
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Error al procesar la consulta',
                error: error.message
            });
        }
    }
}

module.exports = new ChatbotController();
