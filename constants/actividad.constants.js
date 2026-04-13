const CODIGOS_HTTP = {
    OK: 200,
    CREADO: 201,
    BAD_REQUEST: 400,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    ERROR_INTERNO: 500
};

const ROLES_USUARIO = {
    ADMINISTRADOR: 'administrador',
    GERENTE: 'gerente',
    ORGANIZADOR: 'organizador',
    ASISTENTE: 'asistente',
    PONENTE: 'ponente'
};

const MENSAJES_RESPUESTA = {
    ACTIVIDAD_CREADA: 'Actividad creada exitosamente',
    ACTIVIDAD_ACTUALIZADA: 'Actividad actualizada exitosamente',
    ACTIVIDAD_ELIMINADA: 'Actividad eliminada exitosamente',
    ACTIVIDAD_OBTENIDA: 'Actividad obtenida exitosamente',
    ACTIVIDADES_OBTENIDAS: 'Actividades obtenidas exitosamente',
    EVENTO_NO_ENCONTRADO: 'Evento no encontrado',
    ERROR_CREAR: 'Error al crear la actividad',
    ERROR_ACTUALIZAR: 'Error al actualizar actividad',
    ERROR_ELIMINAR: 'Error al eliminar actividad',
    ERROR_OBTENER: 'Error al obtener actividad',
    
    ACTIVIDAD_NO_ENCONTRADA: 'Actividad no encontrada'
};

const MENSAJES_PERMISOS = {
    ACTIVIDAD_NO_ENCONTRADA: 'Actividad no encontrada',
    SIN_ACCESO_EMPRESA: 'No tiene permiso para gestionar actividades de esta empresa',
    ORGANIZADOR_SOLO_PROPIOS: 'Como organizador, solo puedes editar actividades de tus propios eventos',
    SIN_PERMISO_VER: 'No tiene permiso para ver esta actividad'
};

const MENSAJES_VALIDACION = {
    TITULO_REQUERIDO: 'El título de la actividad es requerido y debe tener al menos 3 caracteres',
    HORAS_REQUERIDAS: 'Las horas de inicio y fin son requeridas',
    HORAS_INVALIDAS: 'La hora de inicio debe ser anterior a la hora de fin',
    FECHA_REQUERIDA: 'La fecha de la actividad es requerida',
    FECHA_FUERA_RANGO: 'La fecha de la actividad debe estar dentro del rango de fechas del evento',
    LUGARES_INVALIDOS: 'Uno o más de los lugares especificados no son válidos o no pertenecen a esta empresa'
};

module.exports = {
    CODIGOS_HTTP,
    ROLES_USUARIO,
    MENSAJES_RESPUESTA,
    MENSAJES_PERMISOS,
    MENSAJES_VALIDACION
};
