const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Asistente = sequelize.define('Asistente', {
  id_asistente: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'Asistente',
  timestamps: false
});

module.exports = Asistente;
