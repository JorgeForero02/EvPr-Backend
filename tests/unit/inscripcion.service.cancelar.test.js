/**
 * Tests for InscripcionService.cancelar with mocked DB.
 */

// We'll test the cancelar method by mocking all model operations
const mockInscripcion = {
    estado: 'Confirmada',
    id_asistente: 10,
    update: jest.fn().mockResolvedValue(true),
    evento: {
        titulo: 'Evento Test',
        fecha_inicio: '2099-12-01'  // far in the future so not started
    }
};

const mockAsistente = { id_asistente: 10 };

jest.mock('../../models', () => ({
    Inscripcion: {
        findByPk: jest.fn()
    },
    Asistente: {
        findOne: jest.fn()
    },
    Evento: {},
    sequelize: { transaction: jest.fn() }
}));

jest.mock('../../constants/inscripcion.constants', () => ({
    MENSAJES: {
        INSCRIPCION_NO_ENCONTRADA: 'Inscripción no encontrada',
        SIN_PERMISO_CANCELAR: 'Sin permiso',
        ESTADO_NO_CANCELABLE: 'Estado no cancelable',
        EVENTO_YA_INICIO: 'El evento ya inició',
        CANCELACION_EXITOSA: 'Cancelación exitosa',
        YA_INSCRITO: 'Ya inscrito',
        EVENTO_NO_ENCONTRADO: 'Evento no encontrado',
        EVENTO_NO_DISPONIBLE: 'Evento no disponible',
        EVENTO_FINALIZADO: 'Evento finalizado',
        EVENTO_LLENO: 'Evento lleno',
        ENLACE_INVALIDO: 'Enlace inválido',
        YA_CONFIRMADA: 'Ya confirmada',
        CUPO_ALCANZADO_CONFIRMACION: 'Cupo alcanzado',
        MIS_INSCRIPCIONES_OBTENIDAS: 'OK',
        INSCRIPCION_EXITOSA: 'OK',
        PROCESO_INSCRIPCION_FINALIZADO: 'OK',
        EVENTOS_DISPONIBLES_OBTENIDOS: 'OK',
        SOLO_EVENTOS_PROPIA_EMPRESA: 'Solo propia empresa'
    },
    ESTADOS: {
        CONFIRMADA: 'Confirmada',
        PENDIENTE: 'Pendiente',
        CANCELADA: 'Cancelada'
    }
}));

const { Inscripcion, Asistente } = require('../../models');
const service = require('../../services/inscripcion.service');

describe('InscripcionService.cancelar', () => {
    const mockTransaction = { LOCK: { UPDATE: 'UPDATE' } };

    beforeEach(() => {
        jest.clearAllMocks();
        mockInscripcion.update.mockReset().mockResolvedValue(true);
        mockInscripcion.estado = 'Confirmada';
        mockInscripcion.evento.fecha_inicio = '2099-12-01';
    });

    it('cancela correctamente cuando el asistente es dueño y el evento no ha iniciado', async () => {
        Inscripcion.findByPk.mockResolvedValue(mockInscripcion);
        Asistente.findOne.mockResolvedValue(mockAsistente);

        const result = await service.cancelar(1, 99, mockTransaction);

        expect(result.exito).toBe(true);
        expect(mockInscripcion.update).toHaveBeenCalledWith(
            { estado: 'Cancelada' },
            { transaction: mockTransaction }
        );
    });

    it('retorna error 404 si la inscripción no existe', async () => {
        Inscripcion.findByPk.mockResolvedValue(null);

        const result = await service.cancelar(999, 99, mockTransaction);

        expect(result.exito).toBe(false);
        expect(result.codigoEstado).toBe(404);
    });

    it('retorna error 403 si el asistente no es dueño', async () => {
        Inscripcion.findByPk.mockResolvedValue(mockInscripcion);
        Asistente.findOne.mockResolvedValue({ id_asistente: 99 }); // diferente ID

        const result = await service.cancelar(1, 99, mockTransaction);

        expect(result.exito).toBe(false);
        expect(result.codigoEstado).toBe(403);
    });

    it('retorna error 400 si el estado no es Confirmada', async () => {
        const inscripcionCancelada = { ...mockInscripcion, estado: 'Cancelada' };
        Inscripcion.findByPk.mockResolvedValue(inscripcionCancelada);
        Asistente.findOne.mockResolvedValue(mockAsistente);

        const result = await service.cancelar(1, 99, mockTransaction);

        expect(result.exito).toBe(false);
        expect(result.codigoEstado).toBe(400);
    });

    it('retorna error 400 si el evento ya inició', async () => {
        const inscripcionPasada = {
            ...mockInscripcion,
            evento: { ...mockInscripcion.evento, fecha_inicio: '2020-01-01' }
        };
        Inscripcion.findByPk.mockResolvedValue(inscripcionPasada);
        Asistente.findOne.mockResolvedValue(mockAsistente);

        const result = await service.cancelar(1, 99, mockTransaction);

        expect(result.exito).toBe(false);
        expect(result.codigoEstado).toBe(400);
    });
});
