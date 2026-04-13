const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PonenteActividad = sequelize.define('PonenteActividad', {
  id_ponente: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    references: {
      model: 'Ponente',
      key: 'id_ponente'
    }
  },
  id_actividad: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    references: {
      model: 'Actividad',
      key: 'id_actividad'
    }
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'aceptado', 'rechazado', 'solicitud_cambio'),
    allowNull: false,
    defaultValue: 'pendiente'
  },
  fecha_asignacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  fecha_respuesta: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'Ponente_Actividad',
  timestamps: false
});

module.exports = PonenteActividad;
