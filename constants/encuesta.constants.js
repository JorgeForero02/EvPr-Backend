const TIPOS_ENCUESTA = {
    PRE_ACTIVIDAD: 'pre_actividad',
    DURANTE_ACTIVIDAD: 'durante_actividad',
    POST_ACTIVIDAD: 'post_actividad',
    SATISFACCION_EVENTO: 'satisfaccion_evento'
};

const MOMENTOS = {
    ANTES: 'antes',
    DURANTE: 'durante',
    DESPUES: 'despues'
};

const ESTADOS_ENCUESTA = {
    ACTIVA: 'activa',
    CERRADA: 'cerrada',
    BORRADOR: 'borrador'
};

const ESTADOS_RESPUESTA = {
    PENDIENTE: 'pendiente',
    COMPLETADA: 'completada',
    EXPIRADA: 'expirada'
};

const MENSAJES = {
    CREADA: 'Encuesta creada exitosamente',
    ACTUALIZADA: 'Encuesta actualizada exitosamente',
    ELIMINADA: 'Encuesta eliminada exitosamente',
    OBTENIDA: 'Encuesta obtenida exitosamente',
    LISTA_OBTENIDA: 'Lista de encuestas obtenida exitosamente',
    ERROR_CREAR: 'Error al crear la encuesta',
    ERROR_ACTUALIZAR: 'Error al actualizar la encuesta',
    ERROR_ELIMINAR: 'Error al eliminar la encuesta',
    ERROR_OBTENER: 'Error al obtener la encuesta',
    NO_ENCONTRADA: 'Encuesta no encontrada',
    ENVIADA: 'Encuesta enviada exitosamente',
    ERROR_ENVIAR: 'Error al enviar la encuesta',
    COMPLETADA: 'Encuesta marcada como completada',
    ERROR_COMPLETAR: 'Error al completar la encuesta',
    TOKEN_INVALIDO: 'Token de acceso inválido',
    YA_COMPLETADA: 'Esta encuesta ya ha sido completada',
    ESTADISTICAS_OBTENIDAS: 'Estadísticas obtenidas exitosamente'
};

const CODIGOS_HTTP = {
    OK: 200,
    CREADO: 201,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    CONFLICT: 409,
    ERROR_INTERNO: 500
};

module.exports = {
    TIPOS_ENCUESTA,
    MOMENTOS,
    ESTADOS_ENCUESTA,
    ESTADOS_RESPUESTA,
    MENSAJES,
    CODIGOS_HTTP
};
