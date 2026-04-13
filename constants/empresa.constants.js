const ESTADOS = {
    PENDIENTE: 0,
    ACTIVO: 1,
    RECHAZADO: 2
};

const ROLES = {
    GERENTE: 1,
    ORGANIZADOR: 0
};

const MENSAJES = {
    LISTA_OBTENIDA: 'Lista de empresas obtenida correctamente',
    OBTENIDA: 'Empresa obtenida correctamente',
    CREADA: 'Empresa creada correctamente',
    CREADA_PENDIENTE: 'Empresa creada correctamente. Pendiente de aprobación por el administrador.',
    ACTUALIZADA: 'Empresa actualizada correctamente',
    ELIMINADA: 'Empresa eliminada correctamente',
    NO_ENCONTRADA: 'Empresa no encontrada',
    SIN_PERMISO_VER: 'No tiene permisos para ver esta empresa',
    SIN_PERMISO_EQUIPO: 'No tiene permisos para ver el equipo de esta empresa',
    SOLO_ADMIN_ELIMINAR: 'Solo los administradores pueden eliminar empresas',
    EQUIPO_OBTENIDO: 'Equipo obtenido correctamente',
    PENDIENTES_OBTENIDAS: 'Empresas pendientes obtenidas correctamente',
    YA_PROCESADA: 'Esta empresa ya fue procesada anteriormente',
    APROBADA: 'Empresa aprobada exitosamente',
    RECHAZADA: 'Empresa rechazada'
};

const MENSAJES_VALIDACION = {
    NOMBRE_REQUERIDO: 'El nombre de la empresa es requerido y debe tener al menos 3 caracteres',
    NIT_REQUERIDO: 'El NIT es requerido y debe tener al menos 5 caracteres',
    ROL_NO_PERMITIDO: 'Solo los administradores y asistentes pueden crear empresas'
};

module.exports = {
    ESTADOS,
    ROLES,
    MENSAJES,
    MENSAJES_VALIDACION
};
