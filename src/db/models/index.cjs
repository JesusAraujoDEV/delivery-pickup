const { Zones, ZonesSchema } = require('./zones_model.cjs');
const { Thresholds, ThresholdsSchema } = require('./thresholds_model.cjs');
const { Managers, ManagersSchema } = require('./managers_model.cjs');
const { Orders, OrdersSchema } = require('./order_model.cjs');
const { OrderItems, OrderItemsSchema } = require('./order_items_model.cjs');
const { Logs, LogsSchema } = require('./logs_model.cjs');

function setupModels(sequelize) {
  Zones.init(ZonesSchema, Zones.config(sequelize));
  Thresholds.init(ThresholdsSchema, Thresholds.config(sequelize));
  Managers.init(ManagersSchema, Managers.config(sequelize));
  Orders.init(OrdersSchema, Orders.config(sequelize));
  OrderItems.init(OrderItemsSchema, OrderItems.config(sequelize));
  Logs.init(LogsSchema, Logs.config(sequelize));

  Zones.associate(sequelize.models);
  Thresholds.associate?.(sequelize.models);
  Managers.associate(sequelize.models);
  Orders.associate(sequelize.models);
  OrderItems.associate(sequelize.models);
  Logs.associate(sequelize.models);
}

module.exports = { setupModels };