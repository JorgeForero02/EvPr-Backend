const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PresupuestoItem = sequelize.define('PresupuestoItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_evento: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Evento', key: 'id' }
  },
  id_actividad: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Actividad', key: 'id_actividad' },
    comment: 'Actividad específica a la que pertenece el ítem (opcional)'
  },
  concepto: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: { args: [3, 200], msg: 'El concepto debe tener entre 3 y 200 caracteres' }
    }
  },
  monto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'El monto no puede ser negativo' }
    }
  },
  tipo: {
    type: DataTypes.ENUM('ingreso', 'gasto'),
    allowNull: false,
    comment: 'Tipo de movimiento presupuestario'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fecha_registro: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'PresupuestoItem',
  timestamps: false
});

module.exports = PresupuestoItem;
