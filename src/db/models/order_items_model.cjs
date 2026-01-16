const { Model, DataTypes } = require('sequelize');
const { ORDERS_TABLE } = require('./order_model.cjs');

const ORDER_ITEMS_TABLE = 'dp_order_items';

const OrderItemsSchema = {
  item_id: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.UUID,
  },
  order_id: {
    allowNull: false,
    type: DataTypes.UUID,
    references: {
      model: ORDERS_TABLE,
      key: 'order_id',
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

class OrderItems extends Model {
  static associate(models) {
    this.belongsTo(models.Orders, { as: 'order', foreignKey: 'order_id' });
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: ORDER_ITEMS_TABLE,
      modelName: 'OrderItems',
      timestamps: false,
      underscored: true,
    };
  }
}

module.exports = { ORDER_ITEMS_TABLE, OrderItemsSchema, OrderItems };