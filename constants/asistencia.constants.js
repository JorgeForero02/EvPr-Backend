const CODIGOS_HTTP = {
    OK: 200,
    CREADO: 201,
    BAD_REQUEST: 400,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICTO: 409,
    ERROR_INTERNO: 500
};

const ROLES_USUARIO = {
    ADMINISTRADOR: 'Administrador',
    GERENTE: 'gerente',
    ORGANIZADOR: 'organizador',
    ASISTENTE: 'asistente'
};

const MENSAJES = {
    ASISTENCIA_REGISTRADA: 'Asistencia registrada exitosamente.',
    ASISTENCIA_REGISTRADA_CODIGO: 'Asistencia registrada exitosamente mediante código.',
    ASISTENCIA_YA_REGISTRADA: 'Ya has registrado tu asistencia para hoy.',
    ASISTENCIAS_OBTENIDAS: 'Asistencias obtenidas exitosamente.',
    ASISTENCIAS_EVENTO_OBTENIDAS: 'Asistencias del evento obtenidas exitosamente.',
    SIN_ASISTENCIAS: 'No tienes asistencias registradas.',
    INSCRIPCION_NO_ENCONTRADA: 'Inscripción no encontrada',
    INSCRIPCION_NO_CONFIRMADA: 'No puedes registrar asistencia. Tu inscripción debe estar confirmada.',
    CODIGO_INVALIDO: 'Código de inscripción no válido',
    CODIGO_NO_PERTENECE: 'Este código no te pertenece.',
    NO_PUEDE_REGISTRAR_OTRA_PERSONA: 'No puedes registrar asistencia para otra persona.',
    EVENTO_NO_ENCONTRADO: 'Evento no encontrado',
    EVENTO_NO_DISPONIBLE: 'El evento no está disponible para registro de asistencia.',
    EVENTO_NO_DISPONIBLE_CODIGO: 'El evento no está disponible.',
    FECHA_FUERA_RANGO: 'No es posible registrar asistencia fuera de las fechas del evento.',
    SIN_PERMISO_VER_ASISTENCIAS: 'No tienes permiso para ver las asistencias de este evento.',
    ASISTENCIA_BLOQUEADA_POR_ORGANIZADOR: 'El organizador ya registró tu asistencia. No puedes modificarla.',
    ASISTENCIA_MANUAL_REGISTRADA: 'Asistencia registrada manualmente de forma exitosa.',
    ESTADO_MANUAL_INVALIDO: "El estado debe ser 'Presente' o 'Ausente'.",
    SIN_PERMISO_REGISTRO_MANUAL: 'No tienes permiso para registrar asistencia en este evento.'
};

module.exports = {
    CODIGOS_HTTP,
    ROLES_USUARIO,
    MENSAJES
};
