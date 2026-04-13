const { Empresa, Ciudad } = require('../models');
const { MENSAJES_VALIDACION } = require('../constants/ubicacion.constants');

class UbicacionValidator {
    async validarCreacion({ direccion, id_ciudad, empresaId }) {
        if (!direccion || direccion.trim().length < 3) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.DIRECCION_REQUERIDA
            };
        }

        if (!id_ciudad) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.CIUDAD_REQUERIDA
            };
        }

        const empresa = await Empresa.findByPk(empresaId);
        if (!empresa) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.EMPRESA_NO_ENCONTRADA,
                codigoEstado: 404
            };
        }

        const ciudad = await Ciudad.findByPk(id_ciudad);
        if (!ciudad) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.CIUDAD_NO_ENCONTRADA,
                codigoEstado: 404
            };
        }

        return { esValida: true };
    }
}

module.exports = new UbicacionValidator();
