const { Ciudad } = require('../models');
const { MENSAJES } = require('../constants/ciudad.constants');

class CiudadService {
    async obtenerTodas() {
        return await Ciudad.findAll({
            order: [['nombre', 'ASC']]
        });
    }

    async buscarPorId(id) {
        return await Ciudad.findByPk(id);
    }

    async crear(datos) {
        return await Ciudad.create(datos);
    }

    async actualizar(id, datos) {
        const ciudad = await this.buscarPorId(id);

        if (!ciudad) {
            return {
                exito: false,
                mensaje: MENSAJES.NO_ENCONTRADA
            };
        }

        const datosAnteriores = { ...ciudad.toJSON() };
        await ciudad.update(datos);

        return {
            exito: true,
            ciudad,
            datosAnteriores,
            datosNuevos: ciudad.toJSON()
        };
    }

    async eliminar(id) {
        const ciudad = await this.buscarPorId(id);

        if (!ciudad) {
            return {
                exito: false,
                mensaje: MENSAJES.NO_ENCONTRADA
            };
        }

        await ciudad.destroy();

        return {
            exito: true,
            ciudad
        };
    }
}

module.exports = new CiudadService();
