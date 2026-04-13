const CODIGOS_HTTP = {
    OK: 200,
    CREADO: 201,
    BAD_REQUEST: 400,
    NO_AUTORIZADO: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    ERROR_INTERNO: 500
};

const ROLES_PERMITIDOS = {
    PUBLICOS: ['asistente', 'ponente'],
    ADMIN: ['asistente', 'ponente', 'gerente', 'organizador']
};

const MENSAJES = {
    ROL_NO_PERMITIDO_PUBLICO: 'Solo puede registrarse como asistente o ponente. Para otros roles contacte con un administrador.',
    CREDENCIALES_REQUERIDAS: 'Por favor proporcione correo y contraseña',
    ERROR_SERVIDOR: 'Error en el servidor',
    DATOS_REQUERIDOS_GERENTE: 'Se requiere id_usuario e id_empresa',
    TOKEN_RENOVADO: 'Token renovado exitosamente',
    REFRESH_TOKEN_REQUERIDO: 'No se proporcionó refresh token',
    REFRESH_TOKEN_INVALIDO: 'Refresh token inválido o expirado',
    USUARIO_NO_ENCONTRADO: 'Usuario no encontrado',
    CONTRASENA_ACTUALIZADA: 'Contraseña actualizada exitosamente'
};

const MENSAJES_AUTH = {
    CREDENCIALES_INVALIDAS: 'Correo o contraseña incorrectos',
    SIN_ROL_ASIGNADO: 'El usuario no tiene un rol asignado',
    USUARIO_NO_ENCONTRADO: 'Usuario no encontrado',
    EMPRESA_NO_ENCONTRADA: 'Empresa no encontrada',
    USUARIO_YA_ES_GERENTE: 'El usuario ya es gerente de una empresa',
    GERENTE_SOLO_SU_EMPRESA: 'Un gerente solo puede crear organizadores para su propia empresa',
    CORREO_NO_REGISTRADO: 'El correo no está registrado',
    CUENTA_DESHABILITADA: 'La cuenta está deshabilitada. Contacte al administrador del sistema.',
    ID_EMPRESA_REQUERIDO: 'Se requiere el ID de empresa para gerentes y organizadores',
    REFRESH_TOKEN_INVALIDO: 'Refresh token inválido o expirado'
};

const MENSAJES_VALIDACION = {
    NOMBRE_REQUERIDO: 'El nombre es requerido y debe tener al menos 3 caracteres',
    CEDULA_INVALIDA: 'La cédula debe tener al menos 5 caracteres',
    CORREO_INVALIDO: 'Formato de correo inválido',
    CONTRASENA_CORTA: 'La contraseña debe tener al menos 6 caracteres',
    ID_EMPRESA_REQUERIDO: 'El ID de empresa es requerido',
    ROL_INVALIDO: 'Rol no válido',
    SOLO_ADMIN: 'Solo los administradores pueden crear usuarios con cualquier rol'
};

module.exports = {
    CODIGOS_HTTP,
    ROLES_PERMITIDOS,
    MENSAJES,
    MENSAJES_AUTH,
    MENSAJES_VALIDACION
};
