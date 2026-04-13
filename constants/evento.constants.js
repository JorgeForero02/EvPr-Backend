const ESTADOS = {
    BORRADOR: 0,
    PUBLICADO: 1,
    CANCELADO: 2,
    FINALIZADO: 3
};

const MODALIDADES = ['Presencial', 'Virtual', 'Híbrida'];

const MENSAJES = {
    CREADO: 'Evento creado exitosamente',
    ACTUALIZADO: 'Evento actualizado exitosamente',
    CANCELADO: 'Evento cancelado exitosamente',
    OBTENIDO: 'Evento obtenido exitosamente',
    LISTA_OBTENIDA: 'Eventos obtenidos exitosamente',
    NO_ENCONTRADO_O_SIN_PERMISO: 'Evento no encontrado o no tiene permisos para verlo',
    ERROR_CREAR: 'Error al crear el evento',
    ERROR_ACTUALIZAR: 'Error al actualizar evento',
    ERROR_CANCELAR: 'Error al cancelar evento',
    ERROR_OBTENER: 'Error al obtener evento'
};

const MENSAJES_VALIDACION = {
    TITULO_REQUERIDO: 'El título es requerido y debe tener al menos 3 caracteres',
    MODALIDAD_INVALIDA: 'La modalidad debe ser: Presencial, Virtual o Híbrida',
    FECHA_INICIO_REQUERIDA: 'La fecha de inicio es requerida',
    FECHA_FIN_REQUERIDA: 'La fecha de fin es requerida',
    FECHAS_INVALIDAS: 'La fecha de inicio debe ser anterior a la fecha de fin',
    EMPRESA_NO_EXISTE: 'La empresa especificada no existe',
    EMPRESA_NO_APROBADA: 'Solo se pueden crear eventos en empresas aprobadas',
    ESTADO_INVALIDO: 'Estado no válido.',
    // [BACKEND-FIX] B5: Mensajes faltantes para validación de estado
    EVENTO_CANCELADO: 'No se puede modificar un evento cancelado.',
    EVENTO_FINALIZADO: 'No se puede modificar un evento finalizado.',
    FECHA_LIMITE_CANCELACION_REQUERIDA: 'La fecha límite de cancelación es obligatoria para publicar el evento.',
    FECHA_LIMITE_CANCELACION_INVALIDA: 'La fecha límite de cancelación debe ser anterior o igual a la fecha de inicio del evento.'
};

module.exports = {
    ESTADOS,
    MODALIDADES,
    MENSAJES,
    MENSAJES_VALIDACION
};
