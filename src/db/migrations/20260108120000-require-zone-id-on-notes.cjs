'use strict';

const ORDERS_TABLE = 'dp_orders';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Ensure zone_id is present and (if safe) enforce NOT NULL.
    // We do this defensively to avoid breaking existing data.
    const [[{ null_count }]] = await queryInterface.sequelize.query(
      `SELECT COUNT(*)::int AS null_count FROM ${ORDERS_TABLE} WHERE zone_id IS NULL;`
    );

    // Add index to speed lookups by zone
    try {
      await queryInterface.addIndex(ORDERS_TABLE, ['zone_id'], {
        name: 'idx_dp_orders_zone_id',
      });
    } catch (e) {
      // ignore if already exists
    }

    if (Number(null_count) === 0) {
      await queryInterface.changeColumn(ORDERS_TABLE, 'zone_id', {
        type: Sequelize.UUID,
        allowNull: false,
      });
    } else {
      // Leave nullable to avoid failing migration; API layer enforces it for new orders.
      // eslint-disable-next-line no-console
      console.warn(`[MIGRATION] ${ORDERS_TABLE}.zone_id has ${null_count} NULL rows; leaving column nullable.`);
    }
  },

  async down(queryInterface, Sequelize) {
    // Revert NOT NULL if it was applied
    try {
      await queryInterface.changeColumn(ORDERS_TABLE, 'zone_id', {
        type: Sequelize.UUID,
        allowNull: true,
      });
    } catch (e) {
      // ignore
    }

    try {
      await queryInterface.removeIndex(ORDERS_TABLE, 'idx_dp_orders_zone_id');
    } catch (e) {
      // ignore
    }
  },
};
