class ApiResponse {
  static success(res, data = null, message = 'Operación exitosa', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  static error(res, message = 'Error en la operación', statusCode = 400, error = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      error
    });
  }

  static notFound(res, message = 'Recurso no encontrado') {
    return res.status(404).json({
      success: false,
      message
    });
  }

  static forbidden(res, message = 'Acceso denegado') {
    return res.status(403).json({
      success: false,
      message
    });
  }

  static validationError(res, errors = [], message = 'Error de validación') {
    return res.status(400).json({
      success: false,
      message,
      errors
    });
  }

  static unauthorized(res, message = 'No autenticado') {
    return res.status(401).json({
      success: false,
      message
    });
  }

  static serverError(res, message = 'Error interno del servidor', error = null) {
    return res.status(500).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}

module.exports = ApiResponse;
