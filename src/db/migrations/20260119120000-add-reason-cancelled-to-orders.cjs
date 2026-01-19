'use strict';

/** @type {import('sequelize-cli').Migration} */

const ORDERS_TABLE = 'dp_orders';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(ORDERS_TABLE, 'reason_cancelled', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn(ORDERS_TABLE, 'reason_cancelled');
  },
};
