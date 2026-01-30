'use strict';

const { LOGS_TABLE } = require('../models/logs_model.cjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add logs_type column as ENUM
    await queryInterface.addColumn(LOGS_TABLE, 'logs_type', {
      type: Sequelize.ENUM('orders', 'zones', 'thresholds'),
      allowNull: true,
      comment: 'Type of log entry: orders, zones, or thresholds',
    });

    // Populate logs_type from existing resource field
    await queryInterface.sequelize.query(`
      UPDATE ${LOGS_TABLE}
      SET logs_type = CASE
        WHEN resource = 'orders' THEN 'orders'
        WHEN resource = 'zones' THEN 'zones'
        WHEN resource = 'thresholds' THEN 'thresholds'
        ELSE NULL
      END
      WHERE resource IS NOT NULL;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove the logs_type column
    await queryInterface.removeColumn(LOGS_TABLE, 'logs_type');

    // Drop the ENUM type (PostgreSQL specific)
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_${LOGS_TABLE}_logs_type";
    `);
  },
};
