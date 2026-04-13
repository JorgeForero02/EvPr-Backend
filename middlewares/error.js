const ApiResponse = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return ApiResponse.validationError(res, errors);
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return ApiResponse.error(res, 'Ya existe un registro con esos datos', 409);
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return ApiResponse.error(res, 'Referencia inválida a otro registro', 400);
  }

  return ApiResponse.error(res, err.message || 'Error interno del servidor', err.statusCode || 500);
};

module.exports = errorHandler;
