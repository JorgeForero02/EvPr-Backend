const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pais = sequelize.define('Pais', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'Pais',
  timestamps: false
});

module.exports = Pais;
