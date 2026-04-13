const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ponente = sequelize.define('Ponente', {
  id_ponente: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  especialidad: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'Ponente',
  timestamps: false
});

module.exports = Ponente;
