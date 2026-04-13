const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Auditoria = sequelize.define('Auditoria', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  hora: {
    type: DataTypes.TIME,
    allowNull: false
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  accion: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  id_admin: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID del usuario que realizó la acción'
  },
  entidad_afectada: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Tipo de entidad afectada (usuario, empresa, rol, etc.)'
  },
  datos_anteriores: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Estado de la entidad antes de la operación'
  },
  datos_nuevos: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Estado de la entidad después de la operación'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'Dirección IP desde donde se realizó la operación'
  }
}, {
  tableName: 'Auditoria',
  timestamps: false
});

module.exports = Auditoria;
