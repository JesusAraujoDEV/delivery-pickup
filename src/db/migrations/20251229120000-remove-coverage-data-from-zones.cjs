'use strict';

const { ZONES_TABLE } = require('../models/zones_model.cjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove coverage_data column from zones
    await queryInterface.removeColumn(ZONES_TABLE, 'coverage_data');
  },

  async down(queryInterface, Sequelize) {
    // Re-add coverage_data column (nullable)
    await queryInterface.addColumn(ZONES_TABLE, 'coverage_data', {
      allowNull: true,
      type: Sequelize.JSONB,
    });
  },
};
