const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TipoNotificacion = sequelize.define('TipoNotificacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'Tipo_Notificacion',
  timestamps: false
});

module.exports = TipoNotificacion;
