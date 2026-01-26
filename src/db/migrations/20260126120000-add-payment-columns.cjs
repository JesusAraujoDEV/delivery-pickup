'use strict';
const { ORDERS_TABLE, OrdersSchema } = require('../models/order_model.cjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(ORDERS_TABLE, 'payment_reference', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn(ORDERS_TABLE, 'payment_type', {
      type: Sequelize.ENUM('EFECTIVO', 'DIGITAL'),
      allowNull: false,
      defaultValue: 'EFECTIVO',
    });

    await queryInterface.addColumn(ORDERS_TABLE, 'payment_received', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn(ORDERS_TABLE, 'payment_reference');
    await queryInterface.removeColumn(ORDERS_TABLE, 'payment_received');
    await queryInterface.removeColumn(ORDERS_TABLE, 'payment_type');

    // Drop the enum type created by Sequelize for Postgres
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_dp_orders_payment_type";');
  },
};
