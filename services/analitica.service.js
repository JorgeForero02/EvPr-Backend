// Event-planner/services/analitica.service.js
const models = require('../models');
const sequelize = models.sequelize;
const { EVENTO_ESTADO, UMBRAL_ALTA, UMBRAL_MEDIA, FRANJAS } = require('../constants/analitica.constants');

class AnaliticaService {
  clasificar(tasa) {
    if (tasa === null || tasa === undefined) return null;
    if (tasa >= UMBRAL_ALTA) return 'alta';
    if (tasa >= UMBRAL_MEDIA) return 'media';
    return 'baja';
  }

  franjaHoraria(hora) {
    if (!hora) return null;
    const h = parseInt(String(hora).slice(0, 2), 10);
    if (Number.isNaN(h)) return null;
    if (h >= 6 && h < 12) return FRANJAS.MANANA;
    if (h >= 12 && h < 18) return FRANJAS.TARDE;
    if (h >= 18 && h < 24) return FRANJAS.NOCHE;
    return null;
  }

  _buildFiltroEventos(filtro = {}) {
    const where = [`ev.estado = ${EVENTO_ESTADO.FINALIZADO}`];
    const repl = {};
    if (filtro.id_empresa) { where.push('ev.id_empresa = :id_empresa'); repl.id_empresa = filtro.id_empresa; }
    if (filtro.modalidad)  { where.push('ev.modalidad = :modalidad');   repl.modalidad = filtro.modalidad; }
    return { whereSql: where.join(' AND '), repl };
  }

  async tasaAsistenciaHistorica(filtro = {}) {
    const { whereSql, repl } = this._buildFiltroEventos(filtro);
    const [rows] = await sequelize.query(`
      SELECT COALESCE(SUM(insc.confirmadas),0) AS confirmadas,
             COALESCE(SUM(asist.asistencias),0) AS asistencias,
             COUNT(DISTINCT ev.id) AS muestra
      FROM Evento ev
      LEFT JOIN (SELECT id_evento, SUM(estado='Confirmada') AS confirmadas FROM Inscripcion GROUP BY id_evento) insc ON insc.id_evento=ev.id
      LEFT JOIN (SELECT i.id_evento, COUNT(a.id) AS asistencias FROM Inscripcion i JOIN Asistencia a ON a.inscripcion=i.id GROUP BY i.id_evento) asist ON asist.id_evento=ev.id
      WHERE ${whereSql}
    `, { replacements: repl });
    const row = rows[0] || {};
    const muestra = Number(row.muestra) || 0;
    const confirmadas = Number(row.confirmadas) || 0;
    const asistencias = Number(row.asistencias) || 0;
    if (muestra === 0 || confirmadas === 0) return { tasa: null, muestra };
    return { tasa: Math.round((asistencias / confirmadas) * 100), muestra };
  }

  async riesgoInasistencia(filtro = {}) {
    const { tasa, muestra } = await this.tasaAsistenciaHistorica(filtro);
    if (tasa === null) return { riesgo: null, nivel: null, muestra };
    const riesgo = 100 - tasa;
    const nivel = tasa < UMBRAL_MEDIA ? 'alto' : (tasa < UMBRAL_ALTA ? 'medio' : 'bajo');
    return { riesgo, nivel, muestra };
  }

  async demandaEsperada(filtro = {}) {
    const { whereSql, repl } = this._buildFiltroEventos(filtro);
    const [rows] = await sequelize.query(`
      SELECT AVG(insc.confirmadas) AS promedio, COUNT(DISTINCT ev.id) AS muestra
      FROM Evento ev
      LEFT JOIN (SELECT id_evento, SUM(estado='Confirmada') AS confirmadas FROM Inscripcion GROUP BY id_evento) insc ON insc.id_evento=ev.id
      WHERE ${whereSql}
    `, { replacements: repl });
    const row = rows[0] || {};
    const muestra = Number(row.muestra) || 0;
    if (muestra === 0 || row.promedio === null) return { esperado: null, muestra };
    return { esperado: Math.round(Number(row.promedio)), muestra };
  }

  async satisfaccionHistorica(filtro = {}) {
    const { whereSql, repl } = this._buildFiltroEventos(filtro);
    const [rows] = await sequelize.query(`
      SELECT COALESCE(SUM(enc_d.enviadas),0) AS enviadas,
             COALESCE(SUM(enc_d.respondidas),0) AS respondidas,
             COUNT(DISTINCT ev.id) AS muestra
      FROM Evento ev
      LEFT JOIN (
        SELECT enc.id_evento, COUNT(re.id) AS enviadas, SUM(re.estado='completada') AS respondidas
        FROM Encuesta enc JOIN RespuestaEncuesta re ON re.id_encuesta=enc.id
        WHERE enc.tipo_encuesta='satisfaccion_evento'
        GROUP BY enc.id_evento
      ) enc_d ON enc_d.id_evento=ev.id
      WHERE ${whereSql}
    `, { replacements: repl });
    const row = rows[0] || {};
    const enviadas = Number(row.enviadas) || 0;
    const respondidas = Number(row.respondidas) || 0;
    const muestra = Number(row.muestra) || 0;
    const tasa_respuesta = enviadas > 0 ? Math.round((respondidas / enviadas) * 100) : null;
    return { tasa_respuesta, muestra };
  }

  // Franja horaria con mejor asistencia histórica para el filtro dado; null si no hay datos.
  async mejorFranja(filtro = {}) {
    const { whereSql, repl } = this._buildFiltroEventos(filtro);
    const [rows] = await sequelize.query(`
      SELECT
        CASE
          WHEN HOUR(COALESCE(ev.hora,'12:00:00')) BETWEEN 6 AND 11 THEN 'mañana'
          WHEN HOUR(COALESCE(ev.hora,'12:00:00')) BETWEEN 12 AND 17 THEN 'tarde'
          WHEN HOUR(COALESCE(ev.hora,'12:00:00')) BETWEEN 18 AND 23 THEN 'noche'
          ELSE 'madrugada' END AS franja,
        COALESCE(SUM(insc.confirmadas),0) AS confirmadas,
        COALESCE(SUM(asist.asistencias),0) AS asistencias
      FROM Evento ev
      LEFT JOIN (SELECT id_evento, SUM(estado='Confirmada') AS confirmadas FROM Inscripcion GROUP BY id_evento) insc ON insc.id_evento=ev.id
      LEFT JOIN (SELECT i.id_evento, COUNT(a.id) AS asistencias FROM Inscripcion i JOIN Asistencia a ON a.inscripcion=i.id GROUP BY i.id_evento) asist ON asist.id_evento=ev.id
      WHERE ${whereSql}
      GROUP BY franja
    `, { replacements: repl });
    let best = null;
    for (const r of rows) {
      const conf = Number(r.confirmadas) || 0;
      const asis = Number(r.asistencias) || 0;
      if (conf === 0) continue;
      const tasa = Math.round((asis / conf) * 100);
      if (!best || tasa > best.tasa) best = { franja: r.franja, tasa };
    }
    return best ? best.franja : null;
  }
}

module.exports = new AnaliticaService();
