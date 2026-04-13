const MENSAJES = {
    CREADA: 'Ubicación creada exitosamente',
    ACTUALIZADA: 'Ubicación actualizada exitosamente',
    ELIMINADA: 'Ubicación eliminada exitosamente',
    OBTENIDA: 'Ubicación obtenida exitosamente',
    LISTA_OBTENIDA: 'Ubicaciones obtenidas exitosamente',
    NO_ENCONTRADA: 'Ubicación no encontrada',
    EMPRESA_NO_ENCONTRADA: 'Empresa no encontrada',
    SIN_PERMISO_CREAR: 'No tiene permisos para crear ubicaciones en esta empresa',
    SIN_PERMISO_MODIFICAR: 'No tiene permisos para modificar esta ubicación',
    SIN_PERMISO_VER: 'No tiene permisos para ver las ubicaciones de esta empresa',
    SIN_PERMISO_ELIMINAR: 'No tiene permisos para eliminar esta ubicación',
    ERROR_CREAR: 'Error al crear la ubicación',
    ERROR_ACTUALIZAR: 'Error al actualizar ubicación',
    ERROR_ELIMINAR: 'Error al eliminar ubicación',
    ERROR_OBTENER: 'Error al obtener ubicación',
    HABILITADA: 'Ubicación habilitada exitosamente',
    DESHABILITADA: 'Ubicación deshabilitada exitosamente',
    TIENE_EVENTOS_FUTUROS: 'No se puede deshabilitar: la ubicación tiene salas con actividades en eventos futuros activos',
    SIN_PERMISO_TOGGLE: 'No tiene permisos para cambiar el estado de esta ubicación',
    ERROR_TOGGLE: 'Error al cambiar el estado de la ubicación'
};

const MENSAJES_VALIDACION = {
    DIRECCION_REQUERIDA: 'La dirección es requerida y debe tener al menos 3 caracteres',
    CIUDAD_REQUERIDA: 'La ciudad es requerida',
    CIUDAD_NO_ENCONTRADA: 'Ciudad no encontrada',
    EMPRESA_NO_ENCONTRADA: 'Empresa no encontrada'
};

module.exports = {
    MENSAJES,
    MENSAJES_VALIDACION
};
