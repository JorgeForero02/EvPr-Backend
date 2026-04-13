const sequelize = require('../config/database');

const Usuario = require('./Usuario');
const Administrador = require('./Administrador');
const Asistente = require('./Asistente');
const Ponente = require('./Ponente');
const Empresa = require('./Empresa');
const AdministradorEmpresa = require('./AdministradorEmpresa');
const SolicitudActualizacionEmpresa = require('./SolicitudActualizacionEmpresa');
const PresupuestoItem = require('./PresupuestoItem');
const Pais = require('./Pais');
const Ciudad = require('./Ciudad');
const Ubicacion = require('./Ubicacion');
const Lugar = require('./Lugar');
const Evento = require('./Evento');
const Actividad = require('./Actividad');
const LugarActividad = require('./LugarActividad');
const PonenteActividad = require('./PonenteActividad');
const Inscripcion = require('./Inscripcion');
const Asistencia = require('./Asistencia');
const TipoNotificacion = require('./TipoNotificacion');
const Notificacion = require('./Notificacion');
const Auditoria = require('./Auditoria');
const Encuesta = require('./Encuesta');
const RespuestaEncuesta = require('./RespuestaEncuesta');
const RolSistema = require('./RolSistema');

Usuario.hasOne(Administrador, { foreignKey: 'id_usuario', as: 'administrador' });
Administrador.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

Usuario.hasOne(Asistente, { foreignKey: 'id_usuario', as: 'asistente' });
Asistente.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

Usuario.hasOne(Ponente, { foreignKey: 'id_usuario', as: 'ponente' });
Ponente.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

Usuario.hasMany(AdministradorEmpresa, { foreignKey: 'id_usuario', as: 'empresas' });
AdministradorEmpresa.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

Empresa.hasMany(AdministradorEmpresa, { foreignKey: 'id_empresa', as: 'administradores' });
AdministradorEmpresa.belongsTo(Empresa, { foreignKey: 'id_empresa', as: 'empresa' });

Empresa.hasMany(SolicitudActualizacionEmpresa, { foreignKey: 'id_empresa', as: 'solicitudesActualizacion' });
SolicitudActualizacionEmpresa.belongsTo(Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
SolicitudActualizacionEmpresa.belongsTo(Usuario, { foreignKey: 'id_solicitante', as: 'solicitante' });
SolicitudActualizacionEmpresa.belongsTo(Usuario, { foreignKey: 'id_admin_decision', as: 'adminDecision' });

Empresa.belongsTo(Pais, { foreignKey: 'id_pais', as: 'pais' });
Empresa.belongsTo(Ciudad, { foreignKey: 'id_ciudad', as: 'ciudad' });
Empresa.belongsTo(Usuario, { foreignKey: 'id_creador', as: 'creador' });

Pais.hasMany(Empresa, { foreignKey: 'id_pais', as: 'empresas' });
Ciudad.hasMany(Empresa, { foreignKey: 'id_ciudad', as: 'empresas' });
Usuario.hasMany(Empresa, { foreignKey: 'id_creador', as: 'empresasCreadas' });

Empresa.hasMany(Ubicacion, { foreignKey: 'id_empresa', as: 'ubicaciones' });
Ubicacion.belongsTo(Empresa, { foreignKey: 'id_empresa', as: 'empresa' });

Empresa.hasMany(Lugar, { foreignKey: 'id_empresa', as: 'lugares' });
Lugar.belongsTo(Empresa, { foreignKey: 'id_empresa', as: 'empresa' });

Empresa.hasMany(Evento, { foreignKey: 'id_empresa', as: 'eventos' });

Pais.hasMany(Ciudad, { foreignKey: 'id_pais', as: 'ciudades' });
Ciudad.belongsTo(Pais, { foreignKey: 'id_pais', as: 'pais' });

Ciudad.hasMany(Ubicacion, { foreignKey: 'id_ciudad', as: 'ubicaciones' });
Ubicacion.belongsTo(Ciudad, { foreignKey: 'id_ciudad', as: 'ciudad' });

Ubicacion.hasMany(Lugar, { foreignKey: 'id_ubicacion', as: 'lugares' });
Lugar.belongsTo(Ubicacion, { foreignKey: 'id_ubicacion', as: 'ubicacion' });

Evento.belongsTo(Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
Evento.belongsTo(Usuario, { foreignKey: 'id_creador', as: 'creador' });
Usuario.hasMany(Evento, { foreignKey: 'id_creador', as: 'eventosCreados' });

Evento.hasMany(Actividad, { foreignKey: 'id_evento', as: 'actividades' });
Actividad.belongsTo(Evento, { foreignKey: 'id_evento', as: 'evento' });

Evento.hasMany(Inscripcion, { foreignKey: 'id_evento', as: 'inscripciones' });
Inscripcion.belongsTo(Evento, { foreignKey: 'id_evento', as: 'evento' });

Evento.hasMany(Notificacion, { foreignKey: 'id_evento', as: 'notificaciones' });
Notificacion.belongsTo(Evento, { foreignKey: 'id_evento', as: 'evento' });

Actividad.belongsToMany(Lugar, {
  through: LugarActividad,
  foreignKey: 'id_actividad',
  otherKey: 'id_lugar',
  as: 'lugares'
});

Lugar.belongsToMany(Actividad, {
  through: LugarActividad,
  foreignKey: 'id_lugar',
  otherKey: 'id_actividad',
  as: 'actividades'
});

Actividad.belongsToMany(Ponente, {
  through: PonenteActividad,
  foreignKey: 'id_actividad',
  otherKey: 'id_ponente',
  as: 'ponentes'
});

Ponente.belongsToMany(Actividad, {
  through: PonenteActividad,
  foreignKey: 'id_ponente',
  otherKey: 'id_actividad',
  as: 'actividades'
});

PonenteActividad.belongsTo(Ponente, {
  foreignKey: 'id_ponente',
  as: 'ponente'
});

PonenteActividad.belongsTo(Actividad, {
  foreignKey: 'id_actividad',
  as: 'actividad'
});

Ponente.hasMany(PonenteActividad, {
  foreignKey: 'id_ponente',
  as: 'asignaciones'
});

Actividad.hasMany(PonenteActividad, {
  foreignKey: 'id_actividad',
  as: 'asignaciones'
});
LugarActividad.belongsTo(Lugar, {
  foreignKey: 'id_lugar',
  as: 'lugar'
});

LugarActividad.belongsTo(Actividad, {
  foreignKey: 'id_actividad',
  as: 'actividad'
});

Lugar.hasMany(LugarActividad, {
  foreignKey: 'id_lugar',
  as: 'asignaciones'
});

Actividad.hasMany(LugarActividad, {
  foreignKey: 'id_actividad',
  as: 'lugarAsignaciones'
});

Asistente.hasMany(Inscripcion, { foreignKey: 'id_asistente', as: 'inscripciones' });
Inscripcion.belongsTo(Asistente, { foreignKey: 'id_asistente', as: 'asistente' });

Inscripcion.hasMany(Asistencia, { foreignKey: 'inscripcion', as: 'asistencias' });
Asistencia.belongsTo(Inscripcion, { foreignKey: 'inscripcion', as: 'inscripcionInfo' });

TipoNotificacion.hasMany(Notificacion, { foreignKey: 'id_TipoNotificacion', as: 'notificaciones' });
Notificacion.belongsTo(TipoNotificacion, { foreignKey: 'id_TipoNotificacion', as: 'tipoNotificacion' });

Usuario.hasMany(Notificacion, { foreignKey: 'id_destinatario', as: 'notificaciones' });
Notificacion.belongsTo(Usuario, { foreignKey: 'id_destinatario', as: 'destinatario' });

Encuesta.belongsTo(Evento, { foreignKey: 'id_evento', as: 'evento' });
Encuesta.belongsTo(Actividad, { foreignKey: 'id_actividad', as: 'actividad' });
Evento.hasMany(Encuesta, { foreignKey: 'id_evento', as: 'encuestas' });
Actividad.hasMany(Encuesta, { foreignKey: 'id_actividad', as: 'encuestas' });

RespuestaEncuesta.belongsTo(Encuesta, { foreignKey: 'id_encuesta', as: 'encuesta' });
RespuestaEncuesta.belongsTo(Asistente, { foreignKey: 'id_asistente', as: 'asistente' });
Asistente.hasMany(RespuestaEncuesta, { foreignKey: 'id_asistente', as: 'respuestasEncuesta' });
Encuesta.hasMany(RespuestaEncuesta, { foreignKey: 'id_encuesta', as: 'respuestas' });

Evento.hasMany(PresupuestoItem, { foreignKey: 'id_evento', as: 'presupuestoItems' });
PresupuestoItem.belongsTo(Evento, { foreignKey: 'id_evento', as: 'evento' });
Actividad.hasMany(PresupuestoItem, { foreignKey: 'id_actividad', as: 'presupuestoItems' });
PresupuestoItem.belongsTo(Actividad, { foreignKey: 'id_actividad', as: 'actividad' });

const db = {
  sequelize,
  Sequelize: require('sequelize'),
  Usuario,
  Administrador,
  Asistente,
  Ponente,
  Empresa,
  AdministradorEmpresa,
  SolicitudActualizacionEmpresa,
  PresupuestoItem,
  Pais,
  Ciudad,
  Ubicacion,
  Lugar,
  Evento,
  Actividad,
  LugarActividad,
  PonenteActividad,
  Inscripcion,
  Asistencia,
  TipoNotificacion,
  Notificacion,
  Auditoria,
  Encuesta,
  RespuestaEncuesta,
  RolSistema
};

module.exports = db;
