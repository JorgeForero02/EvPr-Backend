const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Actividad = sequelize.define('Actividad', {
  id_actividad: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: {
        args: [3, 200],
        msg: 'El título debe tener entre 3 y 200 caracteres'
      }
    }
  },
  hora_inicio: {
    type: DataTypes.TIME,
    allowNull: false
  },
  hora_fin: {
    type: DataTypes.TIME,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fecha_actividad: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'La URL debe ser válida'
      }
    }
  },
  id_evento: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Evento',
      key: 'id'
    }
  },
  presupuesto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Presupuesto asignado a esta actividad en COP'
  }
}, {
  tableName: 'Actividad',
  timestamps: false
});

module.exports = Actividad;
