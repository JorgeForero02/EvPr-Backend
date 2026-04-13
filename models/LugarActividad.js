const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LugarActividad = sequelize.define('LugarActividad', {
  id_lugar: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  id_actividad: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  }
}, {
  tableName: 'Lugar_Actividad',
  timestamps: false
});

module.exports = LugarActividad;
