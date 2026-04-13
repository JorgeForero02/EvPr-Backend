const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Asistencia = sequelize.define('Asistencia', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  estado: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  registrado_por: {
    type: DataTypes.ENUM('asistente', 'organizador'),
    allowNull: true,
    comment: 'Indica quién registró la asistencia'
  },
  estado_manual: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'true si el organizador sobrescribió el registro; bloquea el autorregistro del asistente'
  },
  inscripcion: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'Asistencia',
  timestamps: false
});

module.exports = Asistencia;
