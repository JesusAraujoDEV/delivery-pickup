'use strict';

const ORDERS_TABLE = 'dp_orders';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Requirement change: PICKUP orders can omit zone_id.
    await queryInterface.changeColumn(ORDERS_TABLE, 'zone_id', {
      type: Sequelize.UUID,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert to NOT NULL only if safe (no NULL rows).
    const [[{ null_count }]] = await queryInterface.sequelize.query(
      `SELECT COUNT(*)::int AS null_count FROM ${ORDERS_TABLE} WHERE zone_id IS NULL;`
    );

    if (Number(null_count) === 0) {
      await queryInterface.changeColumn(ORDERS_TABLE, 'zone_id', {
        type: Sequelize.UUID,
        allowNull: false,
      });
    } else {
      // eslint-disable-next-line no-console
      console.warn(`[MIGRATION] ${ORDERS_TABLE}.zone_id has ${null_count} NULL rows; leaving column nullable.`);
    }
  },
};
