const CiudadService = require('../services/ciudad.service');
const CiudadValidator = require('../validators/ciudad.validator');
const AuditoriaService = require('../services/auditoriaService');
const ApiResponse = require('../utils/response');
const { MENSAJES } = require('../constants/ciudad.constants');

class CiudadController {
  async getAll(req, res, next) {
    try {
      const ciudades = await CiudadService.obtenerTodas();
      return ApiResponse.success(res, ciudades, MENSAJES.LISTA_OBTENIDA);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const ciudad = await CiudadService.buscarPorId(id);

      if (!ciudad) {
        return ApiResponse.notFound(res, MENSAJES.NO_ENCONTRADA);
      }

      return ApiResponse.success(res, ciudad, MENSAJES.OBTENIDA);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const validacion = CiudadValidator.validarCreacion(req.body);

      if (!validacion.esValida) {
        return ApiResponse.error(res, validacion.mensaje, 400);
      }

      const nuevaCiudad = await CiudadService.crear(req.body);

      await AuditoriaService.registrarCreacion('ciudad', {
        id: nuevaCiudad.id,
        nombre: nuevaCiudad.nombre
      }, req.usuario);

      return ApiResponse.success(res, nuevaCiudad, MENSAJES.CREADA, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;

      const validacion = CiudadValidator.validarActualizacion(req.body);

      if (!validacion.esValida) {
        return ApiResponse.error(res, validacion.mensaje, 400);
      }

      const resultado = await CiudadService.actualizar(id, req.body);

      if (!resultado.exito) {
        return ApiResponse.notFound(res, resultado.mensaje);
      }

      await AuditoriaService.registrarActualizacion(
        'ciudad',
        id,
        resultado.datosAnteriores,
        resultado.datosNuevos,
        req.usuario
      );

      return ApiResponse.success(res, resultado.ciudad, MENSAJES.ACTUALIZADA);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const resultado = await CiudadService.eliminar(id);

      if (!resultado.exito) {
        return ApiResponse.notFound(res, resultado.mensaje);
      }

      await AuditoriaService.registrarEliminacion('ciudad', id, req.usuario);

      return ApiResponse.success(res, null, MENSAJES.ELIMINADA);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CiudadController();
