'use strict';

const { LOGS_TABLE } = require('../models/logs_model.cjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Allow generic action logs not tied to an order
    await queryInterface.changeColumn(LOGS_TABLE, 'order_id', {
      allowNull: true,
      type: Sequelize.UUID,
    });

    await queryInterface.addColumn(LOGS_TABLE, 'manager_display', {
      allowNull: true,
      type: Sequelize.TEXT,
    });

    await queryInterface.addColumn(LOGS_TABLE, 'http_method', {
      allowNull: true,
      type: Sequelize.STRING(10),
    });

    await queryInterface.addColumn(LOGS_TABLE, 'path', {
      allowNull: true,
      type: Sequelize.TEXT,
    });

    await queryInterface.addColumn(LOGS_TABLE, 'resource', {
      allowNull: true,
      type: Sequelize.STRING(50),
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(LOGS_TABLE, 'resource');
    await queryInterface.removeColumn(LOGS_TABLE, 'path');
    await queryInterface.removeColumn(LOGS_TABLE, 'http_method');
    await queryInterface.removeColumn(LOGS_TABLE, 'manager_display');

    await queryInterface.changeColumn(LOGS_TABLE, 'order_id', {
      allowNull: false,
      type: Sequelize.UUID,
    });
  },
};
