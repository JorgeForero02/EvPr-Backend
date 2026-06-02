jest.mock('../../models', () => ({
  Evento: {}, Inscripcion: {}, Asistencia: {}, Actividad: {}, Encuesta: {},
  RespuestaEncuesta: {}, Lugar: {},
  sequelize: { query: jest.fn() }
}));
const models = require('../../models');
const analitica = require('../../services/analitica.service');

describe('clasificar', () => {
  it('alta para tasa >= 70', () => expect(analitica.clasificar(70)).toBe('alta'));
  it('media para tasa 40-69', () => expect(analitica.clasificar(55)).toBe('media'));
  it('baja para tasa < 40', () => expect(analitica.clasificar(39)).toBe('baja'));
  it('null para tasa null', () => expect(analitica.clasificar(null)).toBeNull());
});

describe('franjaHoraria', () => {
  it('mañana para 09:00', () => expect(analitica.franjaHoraria('09:00:00')).toBe('mañana'));
  it('tarde para 14:30', () => expect(analitica.franjaHoraria('14:30:00')).toBe('tarde'));
  it('noche para 20:00', () => expect(analitica.franjaHoraria('20:00')).toBe('noche'));
  it('null para hora vacía', () => expect(analitica.franjaHoraria(null)).toBeNull());
});

describe('tasaAsistenciaHistorica', () => {
  beforeEach(() => jest.clearAllMocks());
  it('calcula tasa = asistencias/confirmadas * 100', async () => {
    models.sequelize.query.mockResolvedValue([[{ confirmadas: 100, asistencias: 80, muestra: 5 }]]);
    const r = await analitica.tasaAsistenciaHistorica({ id_empresa: 1 });
    expect(r).toEqual({ tasa: 80, muestra: 5 });
  });
  it('tasa null cuando muestra 0', async () => {
    models.sequelize.query.mockResolvedValue([[{ confirmadas: 0, asistencias: 0, muestra: 0 }]]);
    const r = await analitica.tasaAsistenciaHistorica({ id_empresa: 1 });
    expect(r).toEqual({ tasa: null, muestra: 0 });
  });
});

describe('riesgoInasistencia', () => {
  beforeEach(() => jest.clearAllMocks());
  it('riesgo = 100 - tasa, nivel alto si asistencia < 40', async () => {
    models.sequelize.query.mockResolvedValue([[{ confirmadas: 100, asistencias: 30, muestra: 4 }]]);
    const r = await analitica.riesgoInasistencia({ modalidad: 'Virtual' });
    expect(r.riesgo).toBe(70);
    expect(r.nivel).toBe('alto');
  });
  it('null cuando sin muestra', async () => {
    models.sequelize.query.mockResolvedValue([[{ confirmadas: 0, asistencias: 0, muestra: 0 }]]);
    const r = await analitica.riesgoInasistencia({});
    expect(r).toEqual({ riesgo: null, nivel: null, muestra: 0 });
  });
});

describe('demandaEsperada', () => {
  beforeEach(() => jest.clearAllMocks());
  it('promedio de confirmadas por evento', async () => {
    models.sequelize.query.mockResolvedValue([[{ promedio: 42.6, muestra: 5 }]]);
    const r = await analitica.demandaEsperada({ modalidad: 'Presencial' });
    expect(r).toEqual({ esperado: 43, muestra: 5 });
  });
  it('null sin muestra', async () => {
    models.sequelize.query.mockResolvedValue([[{ promedio: null, muestra: 0 }]]);
    const r = await analitica.demandaEsperada({});
    expect(r).toEqual({ esperado: null, muestra: 0 });
  });
});

describe('satisfaccionHistorica', () => {
  beforeEach(() => jest.clearAllMocks());
  it('tasa de respuesta de encuestas satisfaccion_evento', async () => {
    models.sequelize.query.mockResolvedValue([[{ enviadas: 50, respondidas: 35, muestra: 6 }]]);
    const r = await analitica.satisfaccionHistorica({ id_empresa: 2 });
    expect(r).toEqual({ tasa_respuesta: 70, muestra: 6 });
  });
});

describe('mejorFranja', () => {
  beforeEach(() => jest.clearAllMocks());
  it('devuelve la franja con mayor tasa de asistencia', async () => {
    models.sequelize.query.mockResolvedValue([[
      { franja: 'mañana', confirmadas: 100, asistencias: 60 },
      { franja: 'tarde', confirmadas: 100, asistencias: 90 },
      { franja: 'noche', confirmadas: 0, asistencias: 0 }
    ]]);
    const r = await analitica.mejorFranja({ modalidad: 'Presencial' });
    expect(r).toBe('tarde');
  });
  it('null cuando no hay datos con inscripciones', async () => {
    models.sequelize.query.mockResolvedValue([[{ franja: 'mañana', confirmadas: 0, asistencias: 0 }]]);
    const r = await analitica.mejorFranja({});
    expect(r).toBeNull();
  });
});
