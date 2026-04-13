const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Empresa = sequelize.define('Empresa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nit: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  direccion: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  correo: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  id_pais: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Pais',
      key: 'id'
    }
  },
  id_ciudad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Ciudad',
      key: 'id'
    }
  },
  estado: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0  
  },
  id_creador: { 
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Usuario',
      key: 'id'
    }
  }
}, {
  tableName: 'Empresa',
  timestamps: false
});

module.exports = Empresa;
