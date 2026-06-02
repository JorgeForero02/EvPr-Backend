jest.mock('../../services/analitica.service', () => ({
  demandaEsperada: jest.fn(),
  riesgoInasistencia: jest.fn()
}));
jest.mock('../../models', () => ({
  Evento: { findAll: jest.fn() },
  sequelize: {}
}));
const analitica = require('../../services/analitica.service');
const { Evento } = require('../../models');
const controller = require('../../controllers/admin.controller');
function buildRes() { const res = {}; res.json = jest.fn().mockReturnValue(res); res.status = jest.fn().mockReturnValue(res); return res; }
describe('obtenerProyecciones', () => {
  beforeEach(() => jest.clearAllMocks());
  it('devuelve proyección por modalidad y por evento', async () => {
    Evento.findAll.mockResolvedValue([{ id: 1, titulo: 'Expo', modalidad: 'Presencial' }]);
    analitica.demandaEsperada.mockResolvedValue({ esperado: 50, muestra: 4 });
    analitica.riesgoInasistencia.mockResolvedValue({ riesgo: 30, nivel: 'bajo', muestra: 4 });
    const res = buildRes();
    await controller.obtenerProyecciones({}, res);
    const payload = res.json.mock.calls[0][0];
    expect(payload.success).toBe(true);
    expect(payload.data.por_evento[0]).toMatchObject({ id_evento: 1, demanda_esperada: 50, riesgo: 30, nivel_riesgo: 'bajo' });
  });
});
