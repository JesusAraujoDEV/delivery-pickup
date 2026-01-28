'use strict';
const { ORDER_ITEMS_TABLE } = require('../models/order_items_model.cjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(ORDER_ITEMS_TABLE, 'excluded_recipe_ids', {
      type: Sequelize.ARRAY(Sequelize.UUID),
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn(ORDER_ITEMS_TABLE, 'excluded_recipe_ids');
  },
};
