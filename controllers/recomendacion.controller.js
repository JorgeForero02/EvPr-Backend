const AnaliticaService = require('../services/analitica.service');
const { MUESTRA_MINIMA } = require('../constants/analitica.constants');

class RecomendacionController {
  async sugerirConfiguracion(req, res) {
    try {
      const { tipo, id_empresa } = req.query;
      const filtro = {};
      if (tipo) filtro.modalidad = tipo;
      if (id_empresa) filtro.id_empresa = id_empresa;

      const demanda = await AnaliticaService.demandaEsperada(filtro);
      const tasa = await AnaliticaService.tasaAsistenciaHistorica(filtro);
      const franjaSugerida = await AnaliticaService.mejorFranja(filtro);

      return res.json({
        success: true,
        data: {
          cupo_sugerido: demanda.esperado,
          franja_sugerida: franjaSugerida,
          tasa_asistencia_referencia: tasa.tasa,
          nivel_referencia: AnaliticaService.clasificar(tasa.tasa),
          muestra: demanda.muestra,
          aviso: demanda.muestra < MUESTRA_MINIMA ? 'Pocos datos históricos; sugerencia orientativa.' : null
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Error al generar sugerencias' });
    }
  }

  async estimarEvento(req, res) {
    try {
      const { modalidad, id_empresa } = req.body;
      const filtro = {};
      if (modalidad) filtro.modalidad = modalidad;
      if (id_empresa) filtro.id_empresa = id_empresa;

      const demanda = await AnaliticaService.demandaEsperada(filtro);
      const riesgo = await AnaliticaService.riesgoInasistencia(filtro);

      return res.json({
        success: true,
        data: {
          inscripciones_esperadas: demanda.esperado,
          riesgo_inasistencia: riesgo.riesgo,
          nivel_riesgo: riesgo.nivel,
          muestra: demanda.muestra,
          aviso: demanda.muestra < MUESTRA_MINIMA ? 'Pocos datos históricos; estimación orientativa.' : null
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Error al estimar el evento' });
    }
  }

  async recomendarSesiones(req, res) {
    try {
      const { id_evento } = req.query;
      const idUsuario = req.usuario?.id;
      if (!id_evento) {
        return res.status(400).json({ success: false, message: 'Se requiere id_evento' });
      }
      const { sequelize } = require('../models');
      const [rows] = await sequelize.query(
        `SELECT act.id_actividad, act.titulo, act.fecha_actividad, act.hora_inicio,
          COALESCE((
            SELECT COUNT(*)
            FROM Actividad pa
            JOIN Evento pev ON pev.id = pa.id_evento AND pev.estado = 2
            JOIN Inscripcion pi ON pi.id_evento = pev.id AND pi.estado = 'Confirmada'
            JOIN Asistente pas ON pas.id_asistente = pi.id_asistente
            WHERE pas.id_usuario = :idUsuario
              AND SUBSTRING_INDEX(pa.titulo,' ',1) = SUBSTRING_INDEX(act.titulo,' ',1)
          ),0) AS relevancia
        FROM Actividad act
        WHERE act.id_evento = :id_evento
        ORDER BY relevancia DESC, act.fecha_actividad ASC, act.hora_inicio ASC`,
        { replacements: { id_evento, idUsuario: idUsuario || 0 } }
      );
      const data = rows.map(r => ({
        id_actividad: r.id_actividad,
        titulo: r.titulo,
        fecha_actividad: r.fecha_actividad,
        hora_inicio: r.hora_inicio,
        relevancia: Number(r.relevancia) || 0
      }));
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Error al recomendar sesiones' });
    }
  }

  async perfilAsistentes(req, res) {
    try {
      const { id_actividad } = req.query;
      if (!id_actividad) {
        return res.status(400).json({ success: false, message: 'Se requiere id_actividad' });
      }
      const { sequelize } = require('../models');
      const [rows] = await sequelize.query(
        `SELECT emp.id AS id_empresa, emp.nombre AS empresa, COUNT(DISTINCT ins.id) AS total
        FROM Actividad act
        JOIN Evento ev ON ev.id = act.id_evento
        JOIN Inscripcion ins ON ins.id_evento = ev.id AND ins.estado = 'Confirmada'
        JOIN Asistente asi ON asi.id_asistente = ins.id_asistente
        JOIN Usuario usu ON usu.id = asi.id_usuario
        LEFT JOIN Administrador_Empresa ae ON ae.id_usuario = usu.id
        LEFT JOIN Empresa emp ON emp.id = ae.id_empresa
        WHERE act.id_actividad = :id_actividad
        GROUP BY emp.id, emp.nombre`,
        { replacements: { id_actividad } }
      );
      const por_empresa = rows.map(r => ({
        empresa: r.empresa || 'Sin empresa',
        total: Number(r.total) || 0
      }));
      const total_inscritos = por_empresa.reduce((s, r) => s + r.total, 0);
      return res.json({ success: true, data: { total_inscritos, por_empresa } });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Error al obtener perfil de asistentes' });
    }
  }

  async sesionesSimilares(req, res) {
    try {
      const { tipo } = req.query;
      const AnaliticaService = require('../services/analitica.service');
      const filtro = {};
      if (tipo) filtro.modalidad = tipo;
      const satisfaccion = await AnaliticaService.satisfaccionHistorica(filtro);
      const tasa = satisfaccion.tasa_respuesta;
      const recomendaciones = [];
      if (tasa === null || satisfaccion.muestra < MUESTRA_MINIMA) {
        recomendaciones.push('Aún hay pocos datos. Usa encuestas interactivas cortas para empezar a medir satisfacción.');
      } else if (tasa >= 70) {
        recomendaciones.push('Mantén encuestas interactivas y estructura el contenido en bloques claros para maximizar el engagement.');
        recomendaciones.push('Cierra cada sesión con un espacio de Q&A en vivo para reforzar la participación y retroalimentación.');
      } else {
        recomendaciones.push('Lanza encuestas más cortas durante la sesión para capturar feedback en el momento de mayor atención.');
        recomendaciones.push('Organiza el contenido en bloques de máximo 20 minutos con interacción para mantener la participación.');
      }
      return res.json({
        success: true,
        data: {
          tasa_participacion_encuestas: tasa,
          muestra: satisfaccion.muestra,
          recomendaciones
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Error al obtener sesiones similares' });
    }
  }

  async resumenEdicionesAnteriores(req, res) {
    try {
      const { Evento, sequelize } = require('../models');
      const { id } = req.params;

      const base = await Evento.findByPk(id, { attributes: ['id', 'titulo', 'id_empresa'] });
      if (!base) {
        return res.status(404).json({ success: false, message: 'Evento no encontrado' });
      }

      const [rows] = await sequelize.query(
        `SELECT ev.id, ev.titulo, ev.fecha_inicio,
          COALESCE(insc.confirmadas,0) AS confirmadas,
          COALESCE(asist.asistencias,0) AS asistencias,
          COALESCE(enc.enc_enviadas,0) AS enc_enviadas,
          COALESCE(enc.enc_respondidas,0) AS enc_respondidas
        FROM Evento ev
        LEFT JOIN (SELECT id_evento, SUM(estado='Confirmada') confirmadas FROM Inscripcion GROUP BY id_evento) insc ON insc.id_evento=ev.id
        LEFT JOIN (SELECT i.id_evento, COUNT(a.id) asistencias FROM Inscripcion i JOIN Asistencia a ON a.inscripcion=i.id GROUP BY i.id_evento) asist ON asist.id_evento=ev.id
        LEFT JOIN (SELECT e.id_evento, COUNT(re.id) enc_enviadas, SUM(re.estado='completada') enc_respondidas FROM Encuesta e JOIN RespuestaEncuesta re ON re.id_encuesta=e.id GROUP BY e.id_evento) enc ON enc.id_evento=ev.id
        WHERE ev.id_empresa = :id_empresa AND ev.titulo = :titulo AND ev.id <> :id_actual AND ev.estado = 2
        ORDER BY ev.fecha_inicio DESC`,
        { replacements: { id_empresa: base.id_empresa, titulo: base.titulo, id_actual: base.id } }
      );

      const ediciones = rows.map(row => {
        const conf = Number(row.confirmadas) || 0;
        const asis = Number(row.asistencias) || 0;
        const env = Number(row.enc_enviadas) || 0;
        const resp = Number(row.enc_respondidas) || 0;
        return {
          id: row.id,
          titulo: row.titulo,
          fecha_inicio: row.fecha_inicio,
          confirmadas: conf,
          asistencias: asis,
          tasa_asistencia: conf > 0 ? Math.round(asis / conf * 100) : null,
          encuestas_enviadas: env,
          encuestas_respondidas: resp,
          tasa_respuesta_encuestas: env > 0 ? Math.round(resp / env * 100) : null
        };
      });

      return res.json({
        success: true,
        data: {
          evento_base: { id: base.id, titulo: base.titulo },
          ediciones
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Error al obtener ediciones anteriores' });
    }
  }
}

module.exports = new RecomendacionController();
