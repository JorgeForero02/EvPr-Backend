const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODEL = 'gpt-4o-mini';

class IAService {
    async generarMensaje({ evento, tipo_mensaje, contexto_adicional }) {
        const tipoDescripcion = {
            recordatorio: 'recordatorio previo al evento',
            modificacion: 'notificación de cambio en el evento',
            cancelacion: 'notificación de cancelación del evento',
            bienvenida: 'mensaje de bienvenida a los inscritos',
            general: 'comunicación general sobre el evento'
        }[tipo_mensaje] || 'mensaje relacionado con el evento';

        const prompt = this._construirPromptMensaje(evento, tipoDescripcion, contexto_adicional);

        const respuesta = await client.chat.completions.create({
            model: MODEL,
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }]
        });

        return respuesta.choices[0].message.content.trim();
    }

    async generarDescripcion({ evento, tono }) {
        const tonoDescripcion = {
            formal: 'formal y profesional',
            amigable: 'amigable y cercano',
            motivador: 'motivador e inspirador'
        }[tono] || 'profesional y claro';

        const prompt = this._construirPromptDescripcion(evento, tonoDescripcion);

        const respuesta = await client.chat.completions.create({
            model: MODEL,
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }]
        });

        return respuesta.choices[0].message.content.trim();
    }

    _construirPromptMensaje(evento, tipoDescripcion, contextoAdicional) {
        const detalles = [
            `Nombre del evento: ${evento.titulo}`,
            evento.fecha_inicio ? `Fecha de inicio: ${evento.fecha_inicio}` : null,
            evento.fecha_fin ? `Fecha de fin: ${evento.fecha_fin}` : null,
            evento.modalidad ? `Modalidad: ${evento.modalidad}` : null,
            evento.descripcion ? `Descripción: ${evento.descripcion}` : null,
            evento.lugar ? `Lugar: ${evento.lugar}` : null,
            contextoAdicional ? `Contexto adicional: ${contextoAdicional}` : null
        ].filter(Boolean).join('\n');

        return `Eres un asistente de comunicación para una plataforma de gestión de eventos corporativos. Redacta un ${tipoDescripcion} para los participantes del siguiente evento:\n\n${detalles}\n\nEl mensaje debe ser claro, profesional, breve (máximo 3 párrafos) y en español. No incluyas saludos genéricos como "Estimado usuario". Devuelve únicamente el cuerpo del mensaje, sin asunto ni firma.`;
    }

    _construirPromptDescripcion(evento, tonoDescripcion) {
        const detalles = [
            `Nombre: ${evento.titulo}`,
            evento.fecha_inicio ? `Fecha: ${evento.fecha_inicio}` : null,
            evento.modalidad ? `Modalidad: ${evento.modalidad}` : null,
            evento.cupos ? `Cupos disponibles: ${evento.cupos}` : null,
            evento.descripcion_actual ? `Descripción actual (mejorar o reemplazar): ${evento.descripcion_actual}` : null,
            evento.actividades && evento.actividades.length > 0
                ? `Actividades: ${evento.actividades.map(a => a.titulo).join(', ')}`
                : null
        ].filter(Boolean).join('\n');

        return `Eres un asistente de comunicación para una plataforma de gestión de eventos corporativos. Genera una descripción completa y atractiva en tono ${tonoDescripcion} para el siguiente evento:\n\n${detalles}\n\nLa descripción debe tener entre 100 y 250 palabras, en español, y comunicar claramente el valor del evento para los asistentes. Devuelve únicamente el texto de la descripción.`;
    }

    async planificarEvento({ mensaje, historial, contexto }) {
        const systemContent = this._construirSistemaPlaneacion(contexto);

        const messages = [
            { role: 'system', content: systemContent },
            ...historial.map(h => ({
                role: h.rol === 'assistant' ? 'assistant' : 'user',
                content: h.contenido
            })),
            { role: 'user', content: mensaje }
        ];

        const respuesta = await client.chat.completions.create({
            model: MODEL,
            max_tokens: 2000,
            response_format: { type: 'json_object' },
            messages
        });

        const raw = respuesta.choices[0].message.content.trim();
        try {
            return JSON.parse(raw);
        } catch {
            return { mensaje: raw, estructura: null };
        }
    }

    _construirSistemaPlaneacion(contexto) {
        const modo = contexto?.tipo || 'evento';
        const datos = contexto?.datos ? JSON.stringify(contexto.datos, null, 2) : '{}';

        const bloqueEvento = modo === 'evento'
            ? `    "evento": {
      "titulo": "Nombre del evento",
      "descripcion": "Descripción atractiva y completa del evento",
      "modalidad": "Presencial",
      "fecha_inicio": "YYYY-MM-DD",
      "fecha_fin": "YYYY-MM-DD",
      "hora": "HH:MM",
      "cupos": 100
    },`
            : '';

        return `Eres un asistente especializado en planificación de eventos corporativos para la plataforma EventPlanner.

IMPORTANTE: Responde ÚNICAMENTE con JSON válido. Sin texto fuera del JSON.

Cuando solo converses o pidas información:
{
  "mensaje": "Tu respuesta conversacional en español",
  "estructura": null
}

Cuando tengas una propuesta concreta lista para aplicar:
{
  "mensaje": "Descripción clara de lo que propusiste",
  "estructura": {
${bloqueEvento}
    "actividades": [
      {
        "titulo": "Nombre de la actividad",
        "descripcion": "Descripción breve",
        "fecha_actividad": "YYYY-MM-DD",
        "hora_inicio": "HH:MM",
        "hora_fin": "HH:MM"
      }
    ]
  }
}

Modo actual: ${modo === 'evento' ? 'creación de evento completo (incluye campo "evento" + "actividades")' : 'planificación de agenda (solo "actividades", sin campo "evento")'}

Datos actuales del formulario:
${datos}

Reglas:
1. modalidad debe ser exactamente: "Presencial", "Virtual" o "Híbrida"
2. Fechas en formato YYYY-MM-DD. Horas en HH:MM (formato 24h)
3. Duración mínima por actividad: 30 minutos
4. Si el usuario pide cambios, devuelve la estructura completa actualizada (no solo el cambio)
5. Si faltan datos importantes para proponer algo concreto, pregunta y pon estructura: null
6. Propón actividades realistas según el tipo de evento y su duración total
7. Si el evento dura varios días, distribuye las actividades correctamente entre los días
8. Responde siempre en español
9. NO incluyas markdown, comentarios ni texto fuera del JSON`;
    }
}

module.exports = new IAService();
