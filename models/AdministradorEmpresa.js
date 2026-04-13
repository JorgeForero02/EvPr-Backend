const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdministradorEmpresa = sequelize.define('AdministradorEmpresa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_empresa: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  es_Gerente: {
    type: DataTypes.TINYINT,
    defaultValue: 0
  }
}, {
  tableName: 'Administrador_Empresa',
  timestamps: false
});

module.exports = AdministradorEmpresa;
