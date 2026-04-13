/**
 * Tests for ActividadValidator pure (non-DB) methods.
 * DB-dependent methods (validarSolapamiento, validarCapacidadSala) are tested via mocks.
 */

// Manually mock the Sequelize models before requiring the validator
jest.mock('../../models', () => ({
    Actividad: {},
    Lugar: {},
    Ponente: {},
    PonenteActividad: {},
    LugarActividad: {},
    Inscripcion: {}
}));
jest.mock('../../constants/actividad.constants', () => ({
    MENSAJES_VALIDACION: {
        TITULO_REQUERIDO: 'Título requerido',
        HORAS_REQUERIDAS: 'Horas requeridas',
        HORAS_INVALIDAS: 'Horas inválidas',
        FECHA_REQUERIDA: 'Fecha requerida',
        FECHA_FUERA_RANGO: 'Fecha fuera de rango del evento',
    }
}));

const validator = require('../../validators/actividad.validator');

describe('ActividadValidator — pure methods', () => {

    describe('_detectarSolapamientoHorario', () => {
        it('detecta solapamiento cuando los rangos se superponen', () => {
            expect(validator._detectarSolapamientoHorario('09:00', '11:00', '10:00', '12:00')).toBe(true);
        });

        it('no detecta solapamiento cuando son contiguos', () => {
            expect(validator._detectarSolapamientoHorario('09:00', '10:00', '10:00', '11:00')).toBe(false);
        });

        it('no detecta solapamiento cuando están separados', () => {
            expect(validator._detectarSolapamientoHorario('09:00', '10:00', '11:00', '12:00')).toBe(false);
        });

        it('detecta solapamiento cuando uno contiene al otro', () => {
            expect(validator._detectarSolapamientoHorario('08:00', '14:00', '09:00', '11:00')).toBe(true);
        });
    });

    describe('_validarFechaActividad', () => {
        const evento = { fecha_inicio: '2025-06-01', fecha_fin: '2025-06-30' };

        it('retorna null para fecha dentro del rango', () => {
            expect(validator._validarFechaActividad('2025-06-15', evento)).toBeNull();
        });

        it('retorna mensaje de error para fecha antes del inicio del evento', () => {
            const result = validator._validarFechaActividad('2025-05-31', evento);
            expect(result).toBe('Fecha fuera de rango del evento');
        });

        it('retorna mensaje de error para fecha después del fin del evento', () => {
            const result = validator._validarFechaActividad('2025-07-01', evento);
            expect(result).toBe('Fecha fuera de rango del evento');
        });

        it('acepta la fecha exacta de inicio del evento', () => {
            expect(validator._validarFechaActividad('2025-06-01', evento)).toBeNull();
        });

        it('acepta la fecha exacta de fin del evento', () => {
            expect(validator._validarFechaActividad('2025-06-30', evento)).toBeNull();
        });
    });

    describe('validarCreacion', () => {
        const evento = { fecha_inicio: '2025-06-01', fecha_fin: '2025-06-30' };

        it('retorna null para datos válidos', () => {
            const datos = {
                titulo: 'Mi Actividad',
                hora_inicio: '09:00',
                hora_fin: '11:00',
                fecha_actividad: '2025-06-15'
            };
            expect(validator.validarCreacion(datos, evento)).toBeNull();
        });

        it('retorna error si el título es muy corto', () => {
            const datos = { titulo: 'AB', hora_inicio: '09:00', hora_fin: '11:00', fecha_actividad: '2025-06-15' };
            expect(validator.validarCreacion(datos, evento)).toBe('Título requerido');
        });

        it('retorna error si falta hora_inicio', () => {
            const datos = { titulo: 'Mi Actividad', hora_inicio: '', hora_fin: '11:00', fecha_actividad: '2025-06-15' };
            expect(validator.validarCreacion(datos, evento)).toBe('Horas requeridas');
        });

        it('retorna error si hora_inicio >= hora_fin', () => {
            const datos = { titulo: 'Mi Actividad', hora_inicio: '11:00', hora_fin: '09:00', fecha_actividad: '2025-06-15' };
            expect(validator.validarCreacion(datos, evento)).toBe('Horas inválidas');
        });

        it('retorna error si falta fecha_actividad', () => {
            const datos = { titulo: 'Mi Actividad', hora_inicio: '09:00', hora_fin: '11:00', fecha_actividad: '' };
            expect(validator.validarCreacion(datos, evento)).toBe('Fecha requerida');
        });

        it('retorna error si la fecha está fuera del rango del evento', () => {
            const datos = { titulo: 'Mi Actividad', hora_inicio: '09:00', hora_fin: '11:00', fecha_actividad: '2025-07-15' };
            expect(validator.validarCreacion(datos, evento)).toBe('Fecha fuera de rango del evento');
        });
    });

    describe('validarActualizacion', () => {
        const evento = { fecha_inicio: '2025-06-01', fecha_fin: '2025-06-30' };
        const actividadExistente = {
            hora_inicio: '09:00',
            hora_fin: '11:00',
            fecha_actividad: '2025-06-15'
        };

        it('retorna null para actualización válida', () => {
            const datos = { hora_inicio: '10:00', hora_fin: '12:00', fecha_actividad: '2025-06-20' };
            expect(validator.validarActualizacion(datos, actividadExistente, evento)).toBeNull();
        });

        it('retorna error si la nueva hora_fin es anterior al hora_inicio', () => {
            const datos = { hora_inicio: '11:00', hora_fin: '09:00' };
            expect(validator.validarActualizacion(datos, actividadExistente, evento)).toBe('Horas inválidas');
        });

        it('usa valores existentes si no se proveen nuevos', () => {
            const datos = {};
            expect(validator.validarActualizacion(datos, actividadExistente, evento)).toBeNull();
        });
    });
});
