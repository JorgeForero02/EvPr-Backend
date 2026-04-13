const MENSAJES = {
    ASIGNADO: 'Ponente asignado a la actividad exitosamente',
    ACTUALIZADO: 'Asignación actualizada exitosamente',
    ELIMINADO: 'Ponente removido de la actividad exitosamente',
    OBTENIDO: 'Asignación obtenida exitosamente',
    LISTA_OBTENIDA: 'Asignaciones obtenidas exitosamente',
    NO_ENCONTRADO: 'Asignación no encontrada',
    PONENTE_NO_ENCONTRADO: 'Ponente no encontrado',
    ACTIVIDAD_NO_ENCONTRADA: 'Actividad no encontrada',
    YA_ASIGNADO: 'Este ponente ya está asignado a esta actividad',
    SOLICITUD_ENVIADA: 'Solicitud de cambio enviada exitosamente',
    SOLICITUD_PROCESADA: 'Solicitud procesada exitosamente',
    INVITACION_ACEPTADA: 'Invitación aceptada exitosamente',
    INVITACION_RECHAZADA: 'Invitación rechazada. Gracias por tu respuesta',
    SOLO_PONENTE_PUEDE_RESPONDER: 'Solo el ponente invitado puede responder a esta invitación',
    INVITACION_YA_RESPONDIDA: 'Esta invitación ya ha sido respondida',
    DEBE_ESTAR_PENDIENTE: 'Solo puedes responder invitaciones en estado pendiente',
    SIN_PERMISO_CREAR: 'No tiene permisos para asignar ponentes',
    SIN_PERMISO_MODIFICAR: 'No tiene permisos para modificar esta asignación',
    SIN_PERMISO_ELIMINAR: 'No tiene permisos para eliminar esta asignación',
    SIN_PERMISO_VER: 'No tiene permisos para ver esta información',
    LISTA_PONENTES_OBTENIDA: 'Lista de ponentes disponibles obtenida exitosamente.',
    ERROR_CREAR: 'Error al asignar ponente',
    ERROR_ACTUALIZAR: 'Error al actualizar asignación',
    ERROR_ELIMINAR: 'Error al eliminar asignación',
    ERROR_OBTENER: 'Error al obtener asignación',
    ERROR_SOLICITUD: 'Error al procesar solicitud de cambio'
};

const MENSAJES_VALIDACION = {
    PONENTE_REQUERIDO: 'El ID del ponente es requerido',
    ACTIVIDAD_REQUERIDA: 'El ID de la actividad es requerido',
    ESTADO_INVALIDO: 'Estado inválido',
    CAMBIOS_REQUERIDOS: 'Debe especificar los cambios solicitados',
    JUSTIFICACION_REQUERIDA: 'Debe proporcionar una justificación para el cambio',
    RESPUESTA_REQUERIDA: 'Debes indicar si aceptas o rechazas la invitación',
    MOTIVO_RECHAZO_RECOMENDADO: 'Es recomendable proporcionar un motivo de rechazo'
};

const ESTADOS_PONENTE_ACTIVIDAD = {
    PENDIENTE: 'pendiente',
    ACEPTADO: 'aceptado',
    RECHAZADO: 'rechazado',
    SOLICITUD_CAMBIO: 'solicitud_cambio'
};

module.exports = {
    MENSAJES,
    MENSAJES_VALIDACION,
    ESTADOS_PONENTE_ACTIVIDAD
};
