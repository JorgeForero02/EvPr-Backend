const { Empresa, Ubicacion } = require('../models');
const { MENSAJES_VALIDACION } = require('../constants/lugar.constants');

class LugarValidator {
    async validarCreacion({ nombre, id_ubicacion, capacidad }, empresaId) {
        if (!nombre || nombre.trim().length < 3) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.NOMBRE_REQUERIDO
            };
        }

        if (!id_ubicacion) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.UBICACION_REQUERIDA
            };
        }

        if (capacidad !== undefined && (capacidad === null || parseInt(capacidad) < 1)) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.CAPACIDAD_INVALIDA
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

        const ubicacion = await Ubicacion.findOne({
            where: { id: id_ubicacion, id_empresa: empresaId }
        });

        if (!ubicacion) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.UBICACION_NO_PERTENECE,
                codigoEstado: 404
            };
        }

        return { esValida: true };
    }

    validarActualizacion({ capacidad }) {
        if (capacidad !== undefined && (capacidad === null || parseInt(capacidad) < 1)) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.CAPACIDAD_INVALIDA
            };
        }

        return { esValida: true };
    }
}

module.exports = new LugarValidator();
