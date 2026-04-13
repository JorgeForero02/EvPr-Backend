const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ciudad = sequelize.define('Ciudad', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codigo_postal: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  id_pais: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'Ciudad',
  timestamps: false
});

module.exports = Ciudad;
