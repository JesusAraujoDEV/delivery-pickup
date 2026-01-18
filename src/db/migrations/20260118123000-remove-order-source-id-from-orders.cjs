'use strict';

/** @type {import('sequelize-cli').Migration} */

const ORDERS_TABLE = 'dp_orders';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn(ORDERS_TABLE, 'order_source_id');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn(ORDERS_TABLE, 'order_source_id', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
  },
};
