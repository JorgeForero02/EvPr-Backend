jest.mock('openai', () => jest.fn().mockImplementation(() => ({ chat: { completions: { create: jest.fn() } } })));
jest.mock('../../models', () => ({
  Evento: { findByPk: jest.fn(), findAll: jest.fn() },
  Actividad: {}, Lugar: {}, Empresa: {}, Inscripcion: {}, Asistente: {},
  sequelize: { literal: jest.fn() }
}));
const service = require('../../services/chatbot.service');
describe('_construirSystemPrompt', () => {
  it('incluye bloque admin y alerta de alto impacto para rol administrador', () => {
    const p = service._construirSystemPrompt('administrador', '/admin', null);
    expect(p).toMatch(/ADMINISTRADOR/); expect(p).toMatch(/alto impacto/i);
  });
  it('incluye eventos inscritos para asistente', () => {
    const p = service._construirSystemPrompt('asistente', '/asistente', { eventosInscritos: [{ titulo: 'Congreso X', fecha_inicio: '2026-07-01' }] });
    expect(p).toMatch(/Congreso X/);
  });
  it('incluye pasos de pantalla para ponente', () => {
    const p = service._construirSystemPrompt('ponente', '/ponente/encuestas', null);
    expect(p).toMatch(/Crear encuesta/);
  });
  it('sin rol devuelve prompt base sin bloques de rol', () => {
    const p = service._construirSystemPrompt(null, null, null);
    expect(p).not.toMatch(/ADMINISTRADOR/);
  });
});
