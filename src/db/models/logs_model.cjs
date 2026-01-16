const { Model, DataTypes, Sequelize } = require('sequelize');
const { ORDERS_TABLE } = require('./order_model.cjs');
const { MANAGERS_TABLE } = require('./managers_model.cjs');

const LOGS_TABLE = 'dp_logs';

const LogsSchema = {
  log_id: {
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
  manager_id: {
    allowNull: true,
    type: DataTypes.UUID,
    references: {
      model: MANAGERS_TABLE,
      key: 'manager_id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  },
  timestamp_transition: {
    allowNull: false,
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
  },
  status_from: {
    allowNull: true,
    type: DataTypes.STRING(30),
  },
  status_to: {
    allowNull: false,
    type: DataTypes.STRING(30),
  },
  cancellation_reason: {
    allowNull: true,
    type: DataTypes.TEXT,
  },
};

class Logs extends Model {
  static associate(models) {
    this.belongsTo(models.Orders, { as: 'order', foreignKey: 'order_id' });
    this.belongsTo(models.Managers, { as: 'manager', foreignKey: 'manager_id' });
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: LOGS_TABLE,
      modelName: 'Logs',
      timestamps: false,
      underscored: true,
    };
  }
}

module.exports = { LOGS_TABLE, LogsSchema, Logs };