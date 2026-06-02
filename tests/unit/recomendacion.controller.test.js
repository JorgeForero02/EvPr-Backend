jest.mock('../../services/analitica.service', () => ({
  demandaEsperada: jest.fn(),
  riesgoInasistencia: jest.fn(),
  tasaAsistenciaHistorica: jest.fn(),
  satisfaccionHistorica: jest.fn(),
  mejorFranja: jest.fn(),
  clasificar: (t) => (t == null ? null : t >= 70 ? 'alta' : t >= 40 ? 'media' : 'baja')
}));
jest.mock('../../models', () => ({
  Evento: { findByPk: jest.fn(), findAll: jest.fn() },
  sequelize: { query: jest.fn() }
}));
const analitica = require('../../services/analitica.service');
const models = require('../../models');
const controller = require('../../controllers/recomendacion.controller');
function buildRes(){const res={};res.json=jest.fn().mockReturnValue(res);res.status=jest.fn().mockReturnValue(res);return res;}

describe('sugerirConfiguracion (RF48)', () => {
  beforeEach(()=>jest.clearAllMocks());
  it('devuelve cupo sugerido desde demanda esperada', async () => {
    analitica.demandaEsperada.mockResolvedValue({ esperado:80, muestra:5 });
    analitica.tasaAsistenciaHistorica.mockResolvedValue({ tasa:75, muestra:5 });
    analitica.mejorFranja.mockResolvedValue('tarde');
    const res=buildRes();
    await controller.sugerirConfiguracion({ query:{ tipo:'Presencial' } }, res);
    const data=res.json.mock.calls[0][0].data;
    expect(data.cupo_sugerido).toBe(80);
    expect(data.franja_sugerida).toBe('tarde');
  });
});
describe('estimarEvento (RF49)', () => {
  beforeEach(()=>jest.clearAllMocks());
  it('devuelve inscripciones esperadas y riesgo', async () => {
    analitica.demandaEsperada.mockResolvedValue({ esperado:60, muestra:4 });
    analitica.riesgoInasistencia.mockResolvedValue({ riesgo:25, nivel:'bajo', muestra:4 });
    const res=buildRes();
    await controller.estimarEvento({ body:{ modalidad:'Virtual' } }, res);
    const data=res.json.mock.calls[0][0].data;
    expect(data.inscripciones_esperadas).toBe(60);
    expect(data.nivel_riesgo).toBe('bajo');
  });
});

describe('resumenEdicionesAnteriores (RF50)', () => {
  beforeEach(()=>jest.clearAllMocks());
  it('devuelve métricas de ediciones previas con mismo título', async () => {
    models.Evento.findByPk.mockResolvedValue({ id:9, titulo:'Summit', id_empresa:1 });
    models.sequelize.query.mockResolvedValue([[
      { id:3, titulo:'Summit', fecha_inicio:'2025-01-01', confirmadas:100, asistencias:80, enc_enviadas:40, enc_respondidas:30 }
    ]]);
    const res=buildRes();
    await controller.resumenEdicionesAnteriores({ params:{ id:9 } }, res);
    const data=res.json.mock.calls[0][0].data;
    expect(data.ediciones[0].tasa_asistencia).toBe(80);
    expect(data.ediciones[0].encuestas_respondidas).toBe(30);
  });
});

describe('recomendarSesiones (RF65)', () => {
  beforeEach(()=>jest.clearAllMocks());
  it('devuelve actividades del evento ordenadas', async () => {
    models.sequelize.query.mockResolvedValue([[
      { id_actividad:1, titulo:'IA aplicada', relevancia:2 },
      { id_actividad:2, titulo:'Redes', relevancia:0 }
    ]]);
    const res=buildRes();
    await controller.recomendarSesiones({ query:{ id_evento:5 }, usuario:{ id:7 } }, res);
    const data=res.json.mock.calls[0][0].data;
    expect(data[0].id_actividad).toBe(1);
  });
});

describe('perfilAsistentes (RF75)', () => {
  beforeEach(()=>jest.clearAllMocks());
  it('devuelve solo agregados, sin nombres/emails', async () => {
    models.sequelize.query.mockResolvedValue([[
      { id_empresa:1, empresa:'ACME', total:12 },
      { id_empresa:2, empresa:'Globex', total:8 }
    ]]);
    const res=buildRes();
    await controller.perfilAsistentes({ query:{ id_actividad:3 } }, res);
    const data=res.json.mock.calls[0][0].data;
    expect(data.total_inscritos).toBe(20);
    const json=JSON.stringify(data);
    expect(json).not.toMatch(/email/i);
    expect(json).not.toMatch(/@/);
  });
});

describe('sesionesSimilares (RF76/RF77)', () => {
  beforeEach(()=>jest.clearAllMocks());
  it('devuelve valoraciones agregadas y recomendaciones', async () => {
    analitica.satisfaccionHistorica.mockResolvedValue({ tasa_respuesta:80, muestra:6 });
    const res=buildRes();
    await controller.sesionesSimilares({ query:{ tipo:'Presencial' } }, res);
    const data=res.json.mock.calls[0][0].data;
    expect(data.tasa_participacion_encuestas).toBe(80);
    expect(Array.isArray(data.recomendaciones)).toBe(true);
  });
});
