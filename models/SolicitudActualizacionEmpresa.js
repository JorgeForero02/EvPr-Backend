const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SolicitudActualizacionEmpresa = sequelize.define('SolicitudActualizacionEmpresa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_empresa: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Empresa', key: 'id' }
  },
  id_solicitante: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Usuario', key: 'id' }
  },
  datos_propuestos: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Campos que el gerente desea actualizar (direccion, telefono, correo, representante, etc.)'
  },
  justificacion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'aprobada', 'rechazada'),
    allowNull: false,
    defaultValue: 'pendiente'
  },
  motivo_rechazo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  id_admin_decision: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Usuario', key: 'id' }
  },
  fecha_solicitud: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  fecha_decision: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'SolicitudActualizacionEmpresa',
  timestamps: false
});

module.exports = SolicitudActualizacionEmpresa;
