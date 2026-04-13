const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ubicacion = sequelize.define('Ubicacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_empresa: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Empresa',
      key: 'id'
    }
  },
  lugar: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  direccion: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  id_ciudad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Ciudad',
      key: 'id'
    }
  },
  activo: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 1,
    comment: '1 = habilitada, 0 = deshabilitada'
  }
}, {
  tableName: 'Ubicacion',
  timestamps: false
});

module.exports = Ubicacion;
