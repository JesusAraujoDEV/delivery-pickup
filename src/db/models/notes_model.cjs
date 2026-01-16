const { Model, DataTypes, Sequelize } = require('sequelize');
const { ZONES_TABLE } = require('./zones_model.cjs');

const NOTES_TABLE = 'dp_orders';

const NotesSchema = {
  note_id: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.UUID,
  },
  readable_id: {
    allowNull: false,
    type: DataTypes.STRING(20),
    unique: true,
  },
  order_source_id: {
    allowNull: true,
    type: DataTypes.STRING(50),
  },
  customer_name: {
    allowNull: false,
    type: DataTypes.STRING(100),
  },
  customer_phone: {
    allowNull: false,
    type: DataTypes.STRING(20),
  },
  customer_email: {
    allowNull: true,
    type: DataTypes.STRING(100),
  },
  delivery_address: {
    allowNull: true,
    type: DataTypes.TEXT,
  },
  service_type: {
    allowNull: false,
    type: DataTypes.ENUM('DELIVERY', 'PICKUP'),
  },
  current_status: {
    allowNull: false,
    type: DataTypes.STRING(30),
  },
  monto_total: {
    allowNull: false,
    type: DataTypes.DECIMAL(10,2),
  },
  monto_costo_envio: {
    allowNull: false,
    type: DataTypes.DECIMAL(10,2),
  },
  timestamp_creation: {
    allowNull: false,
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
  },
  timestamp_approved: {
    allowNull: true,
    type: DataTypes.DATE,
  },
  timestamp_ready: {
    allowNull: true,
    type: DataTypes.DATE,
  },
  timestamp_dispatched: {
    allowNull: true,
    type: DataTypes.DATE,
  },
  timestamp_closure: {
    allowNull: true,
    type: DataTypes.DATE,
  },
  zone_id: {
    allowNull: true,
    type: DataTypes.UUID,
    references: {
      model: ZONES_TABLE,
      key: 'zone_id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  },
};

class Notes extends Model {
  static associate(models) {
    this.belongsTo(models.Zones, { as: 'zone', foreignKey: 'zone_id' });
    this.hasMany(models.NoteItems, { as: 'items', foreignKey: 'note_id' });
    this.hasMany(models.Logs, { as: 'logs', foreignKey: 'note_id' });
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: NOTES_TABLE,
      modelName: 'Notes',
      timestamps: false,
      underscored: true,
    };
  }
}

module.exports = { NOTES_TABLE, NotesSchema, Notes };