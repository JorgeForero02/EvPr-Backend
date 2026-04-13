const MENSAJES = {
    CREADA: 'Notificación creada exitosamente',
    ACTUALIZADA: 'Notificación actualizada exitosamente',
    ELIMINADA: 'Notificación eliminada exitosamente',
    OBTENIDA: 'Notificación obtenida exitosamente',
    LISTA_OBTENIDA: 'Notificaciones obtenidas exitosamente',
    MARCADA_LEIDA: 'Notificación marcada como leída',
    NO_ENCONTRADA: 'Notificación no encontrada',
    SIN_PERMISO_VER: 'No tiene permisos para ver esta notificación',
    SIN_PERMISO_MODIFICAR: 'No tiene permisos para modificar esta notificación',
    ERROR_CREAR: 'Error al crear notificación',
    ERROR_ACTUALIZAR: 'Error al actualizar notificación',
    ERROR_ELIMINAR: 'Error al eliminar notificación',
    ERROR_OBTENER: 'Error al obtener notificación'
};

const ESTADOS_NOTIFICACION = {
    PENDIENTE: 'pendiente',
    LEIDA: 'leida',
    PROCESADA: 'procesada',
    ARCHIVADA: 'archivada'
};

const PRIORIDADES_NOTIFICACION = {
    BAJA: 'baja',
    MEDIA: 'media',
    ALTA: 'alta',
    URGENTE: 'urgente'
};

const TIPOS_ENTIDAD = {
    EVENTO: 'evento',
    ACTIVIDAD: 'actividad',
    PONENTE_ACTIVIDAD: 'ponente_actividad',
    USUARIO: 'usuario',
    EMPRESA: 'empresa',
    OTRO: 'otro'
};

const TIPOS_NOTIFICACION = {
    SOLICITUD_CAMBIO_ACTIVIDAD: 'solicitud_cambio_actividad',
    CAMBIO_APROBADO: 'cambio_aprobado',
    CAMBIO_RECHAZADO: 'cambio_rechazado',
    ASIGNACION_PONENTE: 'asignacion_ponente',
    INVITACION_ACEPTADA: 'invitacion_aceptada',
    INVITACION_RECHAZADA: 'invitacion_rechazada',
    RECORDATORIO_ACTIVIDAD: 'recordatorio_actividad',
    CANCELACION_ACTIVIDAD: 'cancelacion_actividad',
    ACTUALIZACION_EVENTO: 'actualizacion_evento'
};

module.exports = {
    MENSAJES,
    ESTADOS_NOTIFICACION,
    PRIORIDADES_NOTIFICACION,
    TIPOS_ENTIDAD,
    TIPOS_NOTIFICACION
};
