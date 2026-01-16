const { Model, DataTypes } = require('sequelize');
const { NOTES_TABLE } = require('./notes_model.cjs');

const NOTE_ITEMS_TABLE = 'dp_order_items';

const NoteItemsSchema = {
  item_id: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.UUID,
  },
  note_id: {
    allowNull: false,
    type: DataTypes.UUID,
    references: {
      model: NOTES_TABLE,
      key: 'note_id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  product_name: {
    allowNull: false,
    type: DataTypes.STRING(150),
  },
  quantity: {
    allowNull: false,
    type: DataTypes.INTEGER,
  },
  unit_price: {
    allowNull: false,
    type: DataTypes.DECIMAL(10,2),
  },
  subtotal: {
    allowNull: true,
    type: DataTypes.DECIMAL(10,2),
  },
  notes: {
    allowNull: true,
    type: DataTypes.STRING(255),
  },
};

class NoteItems extends Model {
  static associate(models) {
    this.belongsTo(models.Notes, { as: 'note', foreignKey: 'note_id' });
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: NOTE_ITEMS_TABLE,
      modelName: 'NoteItems',
      timestamps: false,
      underscored: true,
    };
  }
}

module.exports = { NOTE_ITEMS_TABLE, NoteItemsSchema, NoteItems };