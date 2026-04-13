/**
 * Tests for LugarService.toggleEstado with mocked DB.
 */

const mockLugarActivo = {
    activo: 1,
    update: jest.fn().mockResolvedValue(true)
};

const mockLugarInactivo = {
    activo: 0,
    update: jest.fn().mockResolvedValue(true)
};

jest.mock('../../models', () => ({
    Lugar: { findByPk: jest.fn() },
    Ubicacion: {},
    Empresa: {},
    LugarActividad: { findOne: jest.fn(), findAll: jest.fn().mockResolvedValue([]) },
    Actividad: {},
    Evento: {}
}));

jest.mock('../../constants/lugar.constants', () => ({
    MENSAJES: {
        NO_ENCONTRADO: 'Lugar no encontrado',
        TIENE_ACTIVIDADES_FUTURAS: 'Tiene actividades futuras',
        EMPRESA_NO_ENCONTRADA: 'Empresa no encontrada'
    }
}));

const { Lugar, LugarActividad } = require('../../models');
const service = require('../../services/lugar.service');

describe('LugarService.toggleEstado', () => {
    const mockTransaction = {};

    beforeEach(() => {
        jest.clearAllMocks();
        mockLugarActivo.update.mockReset().mockResolvedValue(true);
        mockLugarInactivo.update.mockReset().mockResolvedValue(true);
    });

    it('retorna 404 si el lugar no existe', async () => {
        Lugar.findByPk.mockResolvedValue(null);

        const result = await service.toggleEstado(999, mockTransaction);

        expect(result.exito).toBe(false);
        expect(result.codigoEstado).toBe(404);
    });

    it('deshabilita lugar activo sin actividades futuras', async () => {
        Lugar.findByPk.mockResolvedValue(mockLugarActivo);
        LugarActividad.findOne.mockResolvedValue(null);

        const result = await service.toggleEstado(1, mockTransaction);

        expect(result.exito).toBe(true);
        expect(result.habilitado).toBe(false);
        expect(mockLugarActivo.update).toHaveBeenCalledWith(
            { activo: 0 },
            { transaction: mockTransaction }
        );
    });

    it('retorna error al deshabilitar si tiene actividades futuras', async () => {
        Lugar.findByPk.mockResolvedValue(mockLugarActivo);
        LugarActividad.findOne.mockResolvedValue({ id: 1 });

        const result = await service.toggleEstado(1, mockTransaction);

        expect(result.exito).toBe(false);
        expect(result.codigoEstado).toBeGreaterThanOrEqual(400);
        expect(mockLugarActivo.update).not.toHaveBeenCalled();
    });

    it('habilita lugar inactivo sin verificar actividades futuras', async () => {
        Lugar.findByPk.mockResolvedValue(mockLugarInactivo);

        const result = await service.toggleEstado(2, mockTransaction);

        expect(result.exito).toBe(true);
        expect(result.habilitado).toBe(true);
        expect(LugarActividad.findOne).not.toHaveBeenCalled();
        expect(mockLugarInactivo.update).toHaveBeenCalledWith(
            { activo: 1 },
            { transaction: mockTransaction }
        );
    });
});
