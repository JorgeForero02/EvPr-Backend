/**
 * Tests for UbicacionService.toggleEstado with mocked DB.
 */

const mockUbicacionActiva = {
    activo: 1,
    update: jest.fn().mockResolvedValue(true)
};

const mockUbicacionInactiva = {
    activo: 0,
    update: jest.fn().mockResolvedValue(true)
};

jest.mock('../../models', () => ({
    Ubicacion: { findByPk: jest.fn() },
    Ciudad: {},
    Empresa: {},
    Lugar: { findAll: jest.fn() },
    LugarActividad: { findOne: jest.fn() },
    Actividad: {},
    Evento: {}
}));

jest.mock('../../constants/ubicacion.constants', () => ({
    MENSAJES: {
        NO_ENCONTRADA: 'Ubicación no encontrada',
        TIENE_EVENTOS_FUTUROS: 'Tiene eventos futuros',
        EMPRESA_NO_ENCONTRADA: 'Empresa no encontrada'
    }
}));

const { Ubicacion, Lugar, LugarActividad } = require('../../models');
const service = require('../../services/ubicacion.service');

describe('UbicacionService.toggleEstado', () => {
    const mockTransaction = {};

    beforeEach(() => {
        jest.clearAllMocks();
        mockUbicacionActiva.update.mockReset().mockResolvedValue(true);
        mockUbicacionInactiva.update.mockReset().mockResolvedValue(true);
    });

    it('retorna 404 si la ubicación no existe', async () => {
        Ubicacion.findByPk.mockResolvedValue(null);

        const result = await service.toggleEstado(999, mockTransaction);

        expect(result.exito).toBe(false);
        expect(result.codigoEstado).toBe(404);
    });

    it('deshabilita ubicación activa sin actividades futuras', async () => {
        Ubicacion.findByPk.mockResolvedValue(mockUbicacionActiva);
        Lugar.findAll.mockResolvedValue([]);

        const result = await service.toggleEstado(1, mockTransaction);

        expect(result.exito).toBe(true);
        expect(result.habilitada).toBe(false);
        expect(mockUbicacionActiva.update).toHaveBeenCalledWith(
            { activo: 0 },
            { transaction: mockTransaction }
        );
    });

    it('retorna 400 al deshabilitar si tiene actividades futuras', async () => {
        Ubicacion.findByPk.mockResolvedValue(mockUbicacionActiva);
        Lugar.findAll.mockResolvedValue([{ id: 10 }]);
        LugarActividad.findOne.mockResolvedValue({ id: 1 }); // simula actividad futura

        const result = await service.toggleEstado(1, mockTransaction);

        expect(result.exito).toBe(false);
        expect(result.codigoEstado).toBe(400);
        expect(mockUbicacionActiva.update).not.toHaveBeenCalled();
    });

    it('habilita ubicación inactiva sin verificar actividades futuras', async () => {
        Ubicacion.findByPk.mockResolvedValue(mockUbicacionInactiva);

        const result = await service.toggleEstado(2, mockTransaction);

        expect(result.exito).toBe(true);
        expect(result.habilitada).toBe(true);
        expect(LugarActividad.findOne).not.toHaveBeenCalled();
        expect(mockUbicacionInactiva.update).toHaveBeenCalledWith(
            { activo: 1 },
            { transaction: mockTransaction }
        );
    });

    it('permite deshabilitar si tiene lugares pero ninguna actividad futura', async () => {
        Ubicacion.findByPk.mockResolvedValue(mockUbicacionActiva);
        Lugar.findAll.mockResolvedValue([{ id: 5 }, { id: 6 }]);
        LugarActividad.findOne.mockResolvedValue(null); // sin actividades futuras

        const result = await service.toggleEstado(1, mockTransaction);

        expect(result.exito).toBe(true);
        expect(result.habilitada).toBe(false);
    });
});
