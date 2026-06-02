jest.mock('../../models', () => ({ Lugar: { findAll: jest.fn() }, sequelize: { query: jest.fn() } }));
jest.mock('../../services/emailService', () => ({}));
jest.mock('../../services/empresa.service', () => ({}));
jest.mock('../../services/permisos.service', () => ({}));
jest.mock('../../services/auditoriaService', () => ({}));
jest.mock('../../services/notificacion.service', () => ({}));
jest.mock('../../services/analitica.service', () => ({ clasificar: jest.fn(t => t >= 70 ? 'alta' : t >= 40 ? 'media' : 'baja') }));
const models = require('../../models');
const controller = require('../../controllers/empresa.controller');
function buildRes(){const res={};res.json=jest.fn().mockReturnValue(res);res.status=jest.fn().mockReturnValue(res);return res;}
describe('recomendarUbicaciones', () => {
  beforeEach(()=>jest.clearAllMocks());
  it('rankea salas por tasa de asistencia desc', async () => {
    models.sequelize.query.mockResolvedValue([[
      { id_lugar:1, nombre:'Sala A', confirmadas:100, asistencias:90, muestra:4 },
      { id_lugar:2, nombre:'Sala B', confirmadas:100, asistencias:50, muestra:3 }
    ]]);
    const res=buildRes();
    await controller.recomendarUbicaciones({ params:{empresaId:1}, query:{} }, res);
    const data=res.json.mock.calls[0][0].data;
    expect(data[0].id_lugar).toBe(1);
    expect(data[0].tasa_asistencia).toBe(90);
    expect(data[0].nivel).toBe('alta');
  });
});
describe('recomendarFranjas', () => {
  beforeEach(()=>jest.clearAllMocks());
  it('rankea franjas por asistencia', async () => {
    models.sequelize.query.mockResolvedValue([[
      { franja:'mañana', confirmadas:50, asistencias:45, muestra:3 },
      { franja:'noche', confirmadas:50, asistencias:20, muestra:2 }
    ]]);
    const res=buildRes();
    await controller.recomendarFranjas({ params:{empresaId:1}, query:{} }, res);
    const data=res.json.mock.calls[0][0].data;
    expect(data[0].franja).toBe('mañana');
    expect(data[0].tasa_asistencia).toBe(90);
  });
});
