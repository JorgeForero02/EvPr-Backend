const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Evento = sequelize.define('Evento', {
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
  id_creador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Usuario',
      key: 'id'
    }
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
  modalidad: {
    type: DataTypes.ENUM('Presencial', 'Virtual', 'Híbrida'),
    allowNull: false,
    defaultValue: 'Presencial',
    validate: {
      isIn: {
        args: [['Presencial', 'Virtual', 'Híbrida']],
        msg: 'La modalidad debe ser: Presencial, Virtual o Híbrida'
      }
    }
  },
  hora: {
    type: DataTypes.TIME,
    allowNull: true
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cupos: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: {
        args: [1],
        msg: 'Los cupos deben ser al menos 1'
      }
    }
  },
  fecha_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'La fecha de inicio debe ser una fecha válida'
      }
    }
  },
  fecha_fin: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'La fecha de fin debe ser una fecha válida'
      }
    }
  },
  lugar_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Lugar', key: 'id' }
  },
  url_virtual: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  fecha_limite_cancelacion: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: {
        msg: 'La fecha límite de cancelación debe ser una fecha válida'
      }
    }
  },
  estado: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '0=Borrador, 1=Publicado, 2=Cancelado, 3=Finalizado'
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  fecha_actualizacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW
  }
}, {
  tableName: 'Evento',
  timestamps: false,
  createdAt: false,
  updatedAt: false
});

module.exports = Evento;
