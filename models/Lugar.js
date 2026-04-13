const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Lugar = sequelize.define('Lugar', {
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
  id_ubicacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Ubicacion',
      key: 'id'
    }
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      len: {
        args: [3, 150],
        msg: 'El nombre debe tener entre 3 y 150 caracteres'
      }
    }
  },
  capacidad: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  activo: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 1,
    comment: '1 = habilitado, 0 = deshabilitado'
  }
}, {
  tableName: 'Lugar',
  timestamps: false
});

module.exports = Lugar;
