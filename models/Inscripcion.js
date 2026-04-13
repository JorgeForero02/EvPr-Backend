const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Inscripcion = sequelize.define('Inscripcion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  codigo: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  estado: {
    type: DataTypes.STRING(50),
    defaultValue: 'Pendiente'
  },
  id_asistente: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_evento: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'Inscripcion',
  timestamps: false
});

module.exports = Inscripcion;
