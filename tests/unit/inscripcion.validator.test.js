/**
 * Tests for InscripcionValidator pure methods.
 */

const validator = require('../../validators/inscripcion.validator');

describe('InscripcionValidator', () => {

    describe('validarInscripcionEquipo', () => {
        it('retorna esValida=true con datos correctos', () => {
            const result = validator.validarInscripcionEquipo(1, ['123456', '654321']);
            expect(result.esValida).toBe(true);
        });

        it('retorna esValida=false si falta eventoId', () => {
            const result = validator.validarInscripcionEquipo(null, ['123456']);
            expect(result.esValida).toBe(false);
            expect(result.mensaje).toBeTruthy();
        });

        it('retorna esValida=false si cedulas está vacío', () => {
            const result = validator.validarInscripcionEquipo(1, []);
            expect(result.esValida).toBe(false);
            expect(result.mensaje).toBeTruthy();
        });

        it('retorna esValida=false si eventoId y cedulas están vacíos', () => {
            const result = validator.validarInscripcionEquipo(undefined, []);
            expect(result.esValida).toBe(false);
        });
    });
});
