const { Pais } = require('../models');
const { MENSAJES } = require('../constants/pais.constants');

class PaisService {
    async obtenerTodos() {
        return await Pais.findAll({
            order: [['nombre', 'ASC']]
        });
    }

    async buscarPorId(id) {
        return await Pais.findByPk(id);
    }

    async crear(datos) {
        return await Pais.create(datos);
    }

    async actualizar(id, datos) {
        const pais = await this.buscarPorId(id);

        if (!pais) {
            return {
                exito: false,
                mensaje: MENSAJES.NO_ENCONTRADO
            };
        }

        const datosAnteriores = { ...pais.toJSON() };
        await pais.update(datos);

        return {
            exito: true,
            pais,
            datosAnteriores,
            datosNuevos: pais.toJSON()
        };
    }

    async eliminar(id) {
        const pais = await this.buscarPorId(id);

        if (!pais) {
            return {
                exito: false,
                mensaje: MENSAJES.NO_ENCONTRADO
            };
        }

        await pais.destroy();

        return {
            exito: true,
            pais
        };
    }
}

module.exports = new PaisService();
