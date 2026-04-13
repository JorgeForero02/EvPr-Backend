/**
 * Tests for AdminController.obtenerDashboardStats with mocked models.
 */

jest.mock('../../models', () => ({
    Usuario: { count: jest.fn() },
    Administrador: { count: jest.fn() },
    AdministradorEmpresa: { count: jest.fn() },
    Ponente: { count: jest.fn() },
    Asistente: { count: jest.fn() },
    Inscripcion: { count: jest.fn() },
    Asistencia: { count: jest.fn() },
    Evento: { count: jest.fn() },
    Encuesta: { count: jest.fn() },
    RespuestaEncuesta: { count: jest.fn() },
    RolSistema: { count: jest.fn(), findAll: jest.fn(), bulkCreate: jest.fn() },
    sequelize: {}
}));

const {
    Usuario, Administrador, AdministradorEmpresa, Ponente, Asistente,
    Inscripcion, Asistencia, Evento, Encuesta, RespuestaEncuesta
} = require('../../models');
const controller = require('../../controllers/admin.controller');

function buildRes() {
    const res = {};
    res.json = jest.fn().mockReturnValue(res);
    res.status = jest.fn().mockReturnValue(res);
    return res;
}

function setupDefaultMocks({ inscripciones = 10, asistencias = 8 } = {}) {
    Usuario.count.mockResolvedValue(50);
    Administrador.count.mockResolvedValue(2);
    AdministradorEmpresa.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(8);
    Ponente.count.mockResolvedValue(15);
    Asistente.count.mockResolvedValue(20);
    Evento.count
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(3);
    Inscripcion.count.mockResolvedValue(inscripciones);
    RespuestaEncuesta.count
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(20);
    Encuesta.count.mockResolvedValue(5);
    Asistencia.count.mockResolvedValue(asistencias);
}

describe('AdminController.obtenerDashboardStats', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('retorna estructura correcta con datos mockeados', async () => {
        setupDefaultMocks({ inscripciones: 10, asistencias: 8 });
        const req = {};
        const res = buildRes();

        await controller.obtenerDashboardStats(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    usuarios_por_rol: expect.objectContaining({
                        total: 50,
                        administrador: 2,
                        gerente: 5,
                        organizador: 8,
                        ponente: 15,
                        asistente: 20
                    }),
                    eventos_activos: 7,
                    total_inscripciones_confirmadas: 10,
                    total_asistencias: 8
                })
            })
        );
    });

    it('calcula tasa global de asistencia correctamente', async () => {
        setupDefaultMocks({ inscripciones: 10, asistencias: 8 });
        const req = {};
        const res = buildRes();

        await controller.obtenerDashboardStats(req, res);

        const callArg = res.json.mock.calls[0][0];
        expect(callArg.data.tasa_global_asistencia).toBe(80);
    });

    it('retorna tasa 0 si no hay inscripciones confirmadas', async () => {
        setupDefaultMocks({ inscripciones: 0, asistencias: 0 });
        const req = {};
        const res = buildRes();

        await controller.obtenerDashboardStats(req, res);

        const callArg = res.json.mock.calls[0][0];
        expect(callArg.data.tasa_global_asistencia).toBe(0);
    });

    it('retorna 500 si ocurre un error inesperado', async () => {
        Usuario.count.mockRejectedValue(new Error('DB connection lost'));
        const req = {};
        const res = buildRes();

        await controller.obtenerDashboardStats(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: false })
        );
    });
});
