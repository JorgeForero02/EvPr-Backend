/**
 * Tests for EventoService pure methods (no DB dependency).
 */

// Mock all models and DB dependencies
jest.mock('../../models', () => ({
    Evento: {},
    Empresa: {},
    Usuario: {},
    Actividad: {},
    Inscripcion: {},
    Lugar: {},
    Asistente: {},
    Ponente: {},
    PonenteActividad: {},
    AdministradorEmpresa: {},
    Asistencia: {},
    Encuesta: {},
    RespuestaEncuesta: {},
    sequelize: { fn: jest.fn(), col: jest.fn() }
}));
jest.mock('../../constants/evento.constants', () => ({
    ESTADOS: { BORRADOR: 0, PUBLICADO: 1, FINALIZADO: 2, CANCELADO: 3 },
    MODALIDADES: ['Presencial', 'Virtual', 'Hibrida']
}));
jest.mock('../../services/notificacion.service', () => ({}));
jest.mock('../../services/encuesta.service', () => ({}));
jest.mock('../../services/emailService', () => ({}));

const EventoService = require('../../services/evento.service');

describe('EventoService — pure methods', () => {

    describe('_obtenerFechaHoy', () => {
        it('retorna una cadena en formato YYYY-MM-DD', () => {
            const fecha = EventoService._obtenerFechaHoy();
            expect(fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        it('retorna la fecha de hoy', () => {
            const hoy = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'America/Bogota',
                year: 'numeric', month: '2-digit', day: '2-digit'
            }).format(new Date());
            expect(EventoService._obtenerFechaHoy()).toBe(hoy);
        });
    });

    describe('construirActualizaciones', () => {
        it('solo incluye campos permitidos', () => {
            const result = EventoService.construirActualizaciones({
                titulo: 'Nuevo Título',
                estado: 1,
                campo_invalido: 'ignorado'
            });
            expect(result.titulo).toBe('Nuevo Título');
            expect(result.estado).toBe(1);
            expect(result.campo_invalido).toBeUndefined();
            expect(result.fecha_actualizacion).toBeDefined();
        });

        it('no incluye campos no enviados', () => {
            const result = EventoService.construirActualizaciones({ titulo: 'X' });
            expect(result.modalidad).toBeUndefined();
            expect(result.cupos).toBeUndefined();
        });

        it('agrega fecha_actualizacion siempre', () => {
            const result = EventoService.construirActualizaciones({});
            expect(result.fecha_actualizacion).toBeInstanceOf(Date);
        });
    });

    describe('construirFiltros', () => {
        it('filtra por empresa para gerente', () => {
            const filtros = EventoService.construirFiltros({
                rol: 'gerente',
                empresaUsuario: 5
            });
            expect(filtros.id_empresa).toBe(5);
        });

        it('filtra por empresa para organizador', () => {
            const filtros = EventoService.construirFiltros({
                rol: 'organizador',
                empresaUsuario: 3
            });
            expect(filtros.id_empresa).toBe(3);
        });

        it('filtra solo PUBLICADOS para rol no admin', () => {
            const filtros = EventoService.construirFiltros({
                rol: 'asistente',
                empresaUsuario: null
            });
            expect(filtros.estado).toBe(1);
        });

        it('admin puede filtrar por estado arbitrario', () => {
            const filtros = EventoService.construirFiltros({
                rol: 'administrador',
                estado: 2
            });
            expect(filtros.estado).toBe(2);
        });
    });
});
