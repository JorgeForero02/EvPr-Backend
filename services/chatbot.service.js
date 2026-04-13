const OpenAI = require('openai');
const { Evento, Actividad, Lugar, Empresa } = require('../models');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODEL = 'gpt-4o-mini';

class ChatbotService {
    async responder({ pregunta, id_evento }) {
        const contexto = await this._obtenerContexto(id_evento);
        const prompt = this._construirPrompt(pregunta, contexto);

        const respuesta = await client.chat.completions.create({
            model: MODEL,
            max_tokens: 768,
            messages: [{ role: 'user', content: prompt }]
        });

        return respuesta.choices[0].message.content.trim();
    }

    async _obtenerContexto(id_evento) {
        const includeActividades = {
            model: Actividad,
            as: 'actividades',
            attributes: ['id_actividad', 'titulo', 'fecha_actividad', 'hora_inicio', 'hora_fin', 'descripcion'],
            include: [
                {
                    model: Lugar,
                    as: 'lugares',
                    attributes: ['id', 'nombre'],
                    through: { attributes: [] }
                }
            ],
            order: [['fecha_actividad', 'ASC'], ['hora_inicio', 'ASC']]
        };

        if (id_evento) {
            const evento = await Evento.findByPk(id_evento, {
                attributes: ['id', 'titulo', 'fecha_inicio', 'fecha_fin', 'modalidad', 'descripcion', 'cupos', 'url_virtual', 'estado'],
                include: [
                    { model: Empresa, as: 'empresa', attributes: ['id', 'nombre'] },
                    includeActividades
                ]
            });

            return evento ? [evento] : [];
        }

        return await Evento.findAll({
            where: { estado: 1 },
            attributes: ['id', 'titulo', 'fecha_inicio', 'fecha_fin', 'modalidad', 'descripcion', 'cupos', 'url_virtual'],
            include: [
                { model: Empresa, as: 'empresa', attributes: ['id', 'nombre'] },
                {
                    model: Actividad,
                    as: 'actividades',
                    attributes: ['id_actividad', 'titulo', 'fecha_actividad', 'hora_inicio', 'hora_fin']
                }
            ],
            limit: 10,
            order: [['fecha_inicio', 'ASC']]
        });
    }

    _construirPrompt(pregunta, eventos) {
        if (!eventos || eventos.length === 0) {
            return `Eres el asistente virtual de EventPlanner, una plataforma de gestión de eventos corporativos. El usuario preguntó: "${pregunta}". No hay eventos disponibles actualmente. Responde de forma amigable en español, indica que no tienes información de eventos en este momento y sugiere contactar al organizador. Si es una pregunta sobre el uso general de la plataforma, respóndela con orientación básica sobre inscripción, asistencia y encuestas.`;
        }

        const resumenEventos = eventos.map(ev => {
            const actividades = (ev.actividades || []).map(a =>
                `  - ${a.titulo} (${a.fecha_actividad || ''} ${a.hora_inicio || ''}-${a.hora_fin || ''}${a.lugares && a.lugares.length > 0 ? ` en ${a.lugares.map(l => l.nombre).join(', ')}` : ''})`
            ).join('\n');

            return [
                `Evento: ${ev.titulo}`,
                `ID: ${ev.id}`,
                `Fechas: ${ev.fecha_inicio} al ${ev.fecha_fin}`,
                `Modalidad: ${ev.modalidad}`,
                ev.descripcion ? `Descripción: ${ev.descripcion}` : null,
                ev.url_virtual ? `Enlace: ${ev.url_virtual}` : null,
                ev.empresa ? `Empresa organizadora: ${ev.empresa.nombre}` : null,
                ev.cupos ? `Cupos disponibles: ${ev.cupos}` : null,
                actividades ? `Agenda:\n${actividades}` : null
            ].filter(Boolean).join('\n');
        }).join('\n\n---\n\n');

        return `Eres el asistente virtual de EventPlanner, una plataforma de gestión de eventos corporativos. Responde únicamente con información verídica basada en los datos del sistema. Si la pregunta no puede responderse con los datos disponibles, indícalo claramente y de forma amigable. Responde siempre en español, de manera concisa y útil.

INFORMACIÓN DISPONIBLE EN EL SISTEMA:
${resumenEventos}

PREGUNTA DEL USUARIO:
${pregunta}

INSTRUCCIONES:
- Responde solo con datos del sistema. No inventes información.
- Si no sabes la respuesta, indica claramente que no tienes esa información y sugiere contactar al organizador.
- Para preguntas sobre cómo inscribirse, cancelar inscripción, registrar asistencia o responder encuestas, proporciona orientación general sobre el funcionamiento de la plataforma.
- Respuesta máxima: 3 párrafos cortos.`;
    }
}

module.exports = new ChatbotService();
