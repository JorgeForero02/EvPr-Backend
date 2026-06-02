const OpenAI = require('openai');
const { Op } = require('sequelize');
const models = require('../models');
const { Evento, Actividad, Lugar, Empresa, Inscripcion } = models;
const sequelize = models.sequelize;
const { BLOQUES_ROL, PASOS_PANTALLA } = require('../constants/chatbot.constants');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODEL = 'gpt-4o-mini';

class ChatbotService {
    async responder({ pregunta, id_evento, rol = null, pantalla = null, id_usuario = null }) {
        const contexto = await this._obtenerContexto(id_evento);

        let contextoUsuario = null;
        if (rol === 'asistente' && id_usuario) {
            contextoUsuario = { eventosInscritos: await this._obtenerEventosInscritos(id_usuario) };
        }

        const systemPrompt = this._construirSystemPrompt(rol, pantalla, contextoUsuario);
        const userPrompt = this._construirPrompt(pregunta, contexto);

        const respuesta = await client.chat.completions.create({
            model: MODEL,
            max_tokens: 768,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        });

        return respuesta.choices[0].message.content.trim();
    }

    _construirSystemPrompt(rol, pantalla, contextoUsuario) {
        const partes = [];

        partes.push('Eres el asistente virtual de EventPlanner, una plataforma de gestión de eventos corporativos. Responde siempre en español, de manera concisa y veraz. No inventes información que no esté disponible en el sistema.');

        if (rol && BLOQUES_ROL[rol]) {
            partes.push(BLOQUES_ROL[rol]);
        }

        if (pantalla && PASOS_PANTALLA[pantalla]) {
            partes.push(`Contexto de pantalla actual: ${PASOS_PANTALLA[pantalla]}`);
        }

        if (rol === 'asistente' && contextoUsuario && contextoUsuario.eventosInscritos && contextoUsuario.eventosInscritos.length > 0) {
            const lista = contextoUsuario.eventosInscritos.map(ev => {
                const partesFecha = ev.fecha_inicio ? `fecha: ${ev.fecha_inicio}` : '';
                const partesEnlace = ev.url_virtual ? `, enlace: ${ev.url_virtual}` : '';
                const partesModalidad = ev.modalidad ? `, modalidad: ${ev.modalidad}` : '';
                return `- ${ev.titulo} (${partesFecha}${partesEnlace}${partesModalidad})`;
            }).join('\n');
            partes.push(`Eventos inscritos del usuario:\n${lista}`);
        }

        return partes.join('\n\n');
    }

    async _obtenerEventosInscritos(idUsuario) {
        const { Evento: EvModel, Inscripcion: InscModel, Asistente: AsisModel } = require('../models');

        let asistente = null;
        try {
            asistente = await AsisModel.findOne({ where: { id_usuario: idUsuario } });
        } catch (e) {
            return [];
        }

        if (!asistente) return [];

        const inscripciones = await InscModel.findAll({
            where: { id_asistente: asistente.id_asistente, estado: 'Confirmada' },
            include: [{
                model: EvModel,
                as: 'evento',
                attributes: ['id', 'titulo', 'fecha_inicio', 'fecha_fin', 'modalidad', 'url_virtual']
            }]
        });

        return inscripciones.map(i => i.evento).filter(Boolean);
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
                attributes: [
                    'id', 'titulo', 'fecha_inicio', 'fecha_fin', 'modalidad', 'descripcion',
                    'cupos', 'url_virtual', 'estado',
                    [sequelize.literal('(SELECT COUNT(*) FROM Inscripcion WHERE Inscripcion.id_evento = Evento.id AND Inscripcion.estado = \'Confirmada\')'), 'inscritos']
                ],
                include: [
                    { model: Empresa, as: 'empresa', attributes: ['id', 'nombre'] },
                    includeActividades
                ]
            });

            return evento ? [evento] : [];
        }

        const hoy = new Date().toISOString().split('T')[0];

        return await Evento.findAll({
            where: { estado: 1, fecha_fin: { [Op.gte]: hoy } },
            attributes: [
                'id', 'titulo', 'fecha_inicio', 'fecha_fin', 'modalidad', 'descripcion',
                'cupos', 'url_virtual',
                [sequelize.literal('(SELECT COUNT(*) FROM Inscripcion WHERE Inscripcion.id_evento = Evento.id AND Inscripcion.estado = \'Confirmada\')'), 'inscritos']
            ],
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
                (() => {
                    const total = ev.cupos;
                    const inscritos = parseInt(ev.inscritos) || 0;
                    if (total == null || total === 0) return null;
                    const disponibles = Math.max(0, total - inscritos);
                    return `Cupos: ${total} totales, ${inscritos} inscritos, ${disponibles} disponibles`;
                })(),
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
