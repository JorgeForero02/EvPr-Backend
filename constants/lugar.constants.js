const MENSAJES = {
    CREADO: 'Lugar creado exitosamente',
    ACTUALIZADO: 'Lugar actualizado exitosamente',
    ELIMINADO: 'Lugar eliminado exitosamente',
    OBTENIDO: 'Lugar obtenido exitosamente',
    LISTA_OBTENIDA: 'Lugares obtenidos exitosamente',
    NO_ENCONTRADO: 'Lugar no encontrado',
    EMPRESA_NO_ENCONTRADA: 'Empresa no encontrada',
    SIN_PERMISO_CREAR: 'No tiene permisos para crear lugares en esta empresa',
    SIN_PERMISO_MODIFICAR: 'No tiene permisos para modificar este lugar',
    SIN_PERMISO_ELIMINAR: 'No tiene permisos para eliminar este lugar',
    SIN_PERMISO_VER: 'No tiene permisos para ver los lugares de esta empresa',
    TIENE_ACTIVIDADES_ASOCIADAS: 'No se puede eliminar un lugar que tiene actividades asociadas',
    ERROR_CREAR: 'Error al crear el lugar',
    ERROR_ACTUALIZAR: 'Error al actualizar lugar',
    ERROR_ELIMINAR: 'Error al eliminar lugar',
    ERROR_OBTENER: 'Error al obtener lugar',
    HABILITADO: 'Sala habilitada exitosamente',
    DESHABILITADO: 'Sala deshabilitada exitosamente',
    TIENE_ACTIVIDADES_FUTURAS: 'No se puede deshabilitar: la sala tiene actividades asignadas en eventos futuros activos',
    SIN_PERMISO_TOGGLE: 'No tiene permisos para cambiar el estado de esta sala',
    ERROR_TOGGLE: 'Error al cambiar el estado de la sala'
};

const MENSAJES_VALIDACION = {
    NOMBRE_REQUERIDO: 'El nombre es requerido y debe tener al menos 3 caracteres',
    UBICACION_REQUERIDA: 'La ubicación es requerida',
    CAPACIDAD_INVALIDA: 'La capacidad, si se especifica, debe ser al menos 1',
    EMPRESA_NO_ENCONTRADA: 'Empresa no encontrada',
    UBICACION_NO_PERTENECE: 'Ubicación no encontrada o no pertenece a esta empresa'
};

module.exports = {
    MENSAJES,
    MENSAJES_VALIDACION
};
