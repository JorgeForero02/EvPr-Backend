/**
 * Tests for ActividadValidator.validarCapacidadSala with mocked DB.
 */

jest.mock('../../models', () => ({
    Actividad: {},
    Lugar: { findByPk: jest.fn() },
    Ponente: {},
    PonenteActividad: {},
    LugarActividad: {},
    Inscripcion: { count: jest.fn() }
}));

jest.mock('../../constants/actividad.constants', () => ({
    MENSAJES_VALIDACION: {
        TITULO_REQUERIDO: 'Título requerido',
        HORAS_REQUERIDAS: 'Horas requeridas',
        HORAS_INVALIDAS: 'Horas inválidas',
        FECHA_REQUERIDA: 'Fecha requerida',
        FECHA_FUERA_RANGO: 'Fecha fuera de rango del evento'
    }
}));

const { Lugar, Inscripcion } = require('../../models');
const validator = require('../../validators/actividad.validator');

describe('ActividadValidator.validarCapacidadSala', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('retorna null si idsLugares está vacío', async () => {
        const result = await validator.validarCapacidadSala([], 1);
        expect(result).toBeNull();
        expect(Inscripcion.count).not.toHaveBeenCalled();
    });

    it('retorna null si idsLugares es null', async () => {
        const result = await validator.validarCapacidadSala(null, 1);
        expect(result).toBeNull();
    });

    it('retorna null si los inscritos no superan la capacidad', async () => {
        Inscripcion.count.mockResolvedValue(50);
        Lugar.findByPk.mockResolvedValue({ id: 1, nombre: 'Sala A', capacidad: 100 });

        const result = await validator.validarCapacidadSala([1], 10);

        expect(result).toBeNull();
    });

    it('retorna mensaje de error si los inscritos superan la capacidad de la sala', async () => {
        Inscripcion.count.mockResolvedValue(120);
        Lugar.findByPk.mockResolvedValue({ id: 1, nombre: 'Sala Principal', capacidad: 100 });

        const result = await validator.validarCapacidadSala([1], 10);

        expect(result).toContain('Sala Principal');
        expect(result).toContain('100');
        expect(result).toContain('120');
    });

    it('retorna null si el lugar no tiene capacidad definida (null)', async () => {
        Inscripcion.count.mockResolvedValue(200);
        Lugar.findByPk.mockResolvedValue({ id: 2, nombre: 'Sala Sin Límite', capacidad: null });

        const result = await validator.validarCapacidadSala([2], 10);

        expect(result).toBeNull();
    });

    it('retorna null si el lugar no existe', async () => {
        Inscripcion.count.mockResolvedValue(50);
        Lugar.findByPk.mockResolvedValue(null);

        const result = await validator.validarCapacidadSala([99], 10);

        expect(result).toBeNull();
    });

    it('verifica el primer lugar que excede la capacidad (múltiples lugares)', async () => {
        Inscripcion.count.mockResolvedValue(80);
        Lugar.findByPk
            .mockResolvedValueOnce({ id: 1, nombre: 'Sala OK', capacidad: 100 })
            .mockResolvedValueOnce({ id: 2, nombre: 'Sala Pequeña', capacidad: 50 });

        const result = await validator.validarCapacidadSala([1, 2], 10);

        expect(result).toContain('Sala Pequeña');
    });
});
