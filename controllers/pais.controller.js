const PaisService = require('../services/pais.service');
const PaisValidator = require('../validators/pais.validator');
const AuditoriaService = require('../services/auditoriaService');
const ApiResponse = require('../utils/response');
const { MENSAJES } = require('../constants/pais.constants');

class PaisController {
  async getAll(req, res, next) {
    try {
      const paises = await PaisService.obtenerTodos();
      return ApiResponse.success(res, paises, MENSAJES.LISTA_OBTENIDA);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const pais = await PaisService.buscarPorId(id);

      if (!pais) {
        return ApiResponse.notFound(res, MENSAJES.NO_ENCONTRADO);
      }

      return ApiResponse.success(res, pais, MENSAJES.OBTENIDO);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const validacion = PaisValidator.validarCreacion(req.body);

      if (!validacion.esValida) {
        return ApiResponse.error(res, validacion.mensaje, 400);
      }

      const nuevoPais = await PaisService.crear(req.body);

      await AuditoriaService.registrarCreacion('pais', {
        id: nuevoPais.id,
        nombre: nuevoPais.nombre
      }, req.usuario);

      return ApiResponse.success(res, nuevoPais, MENSAJES.CREADO, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;

      const validacion = PaisValidator.validarActualizacion(req.body);

      if (!validacion.esValida) {
        return ApiResponse.error(res, validacion.mensaje, 400);
      }

      const resultado = await PaisService.actualizar(id, req.body);

      if (!resultado.exito) {
        return ApiResponse.notFound(res, resultado.mensaje);
      }

      await AuditoriaService.registrarActualizacion(
        'pais',
        id,
        resultado.datosAnteriores,
        resultado.datosNuevos,
        req.usuario
      );

      return ApiResponse.success(res, resultado.pais, MENSAJES.ACTUALIZADO);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const resultado = await PaisService.eliminar(id);

      if (!resultado.exito) {
        return ApiResponse.notFound(res, resultado.mensaje);
      }

      await AuditoriaService.registrarEliminacion('pais', id, req.usuario);

      return ApiResponse.success(res, null, MENSAJES.ELIMINADO);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaisController();
