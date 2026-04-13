const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notificacion = sequelize.define('Notificacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_TipoNotificacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Tipo_Notificacion',
      key: 'id'
    }
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  contenido: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  entidad_tipo: {
    type: DataTypes.ENUM('evento', 'actividad', 'ponente_actividad', 'usuario', 'empresa', 'otro'),
    allowNull: true,
    comment: 'Tipo de entidad a la que hace referencia'
  },
  entidad_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID de la entidad referenciada'
  },
  id_evento: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Evento',
      key: 'id'
    }
  },
  id_destinatario: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Usuario',
      key: 'id'
    },
    comment: 'Usuario destinatario de la notificación'
  },
  datos_adicionales: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Datos específicos del contexto'
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'leida', 'procesada', 'archivada'),
    allowNull: false,
    defaultValue: 'pendiente'
  },
  prioridad: {
    type: DataTypes.ENUM('baja', 'media', 'alta', 'urgente'),
    allowNull: false,
    defaultValue: 'media'
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  fecha_leida: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'Notificacion',
  timestamps: false
});

module.exports = Notificacion;
