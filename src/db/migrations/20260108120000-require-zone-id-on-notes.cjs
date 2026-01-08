'use strict';

const { NOTES_TABLE } = require('../models/notes_model.cjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Ensure zone_id is present and (if safe) enforce NOT NULL.
    // We do this defensively to avoid breaking existing data.
    const [[{ null_count }]] = await queryInterface.sequelize.query(
      `SELECT COUNT(*)::int AS null_count FROM ${NOTES_TABLE} WHERE zone_id IS NULL;`
    );

    // Add index to speed lookups by zone
    try {
      await queryInterface.addIndex(NOTES_TABLE, ['zone_id'], {
        name: 'idx_dp_notes_zone_id',
      });
    } catch (e) {
      // ignore if already exists
    }

    if (Number(null_count) === 0) {
      await queryInterface.changeColumn(NOTES_TABLE, 'zone_id', {
        type: Sequelize.UUID,
        allowNull: false,
      });
    } else {
      // Leave nullable to avoid failing migration; API layer enforces it for new orders.
      // eslint-disable-next-line no-console
      console.warn(`[MIGRATION] ${NOTES_TABLE}.zone_id has ${null_count} NULL rows; leaving column nullable.`);
    }
  },

  async down(queryInterface, Sequelize) {
    // Revert NOT NULL if it was applied
    try {
      await queryInterface.changeColumn(NOTES_TABLE, 'zone_id', {
        type: Sequelize.UUID,
        allowNull: true,
      });
    } catch (e) {
      // ignore
    }

    try {
      await queryInterface.removeIndex(NOTES_TABLE, 'idx_dp_notes_zone_id');
    } catch (e) {
      // ignore
    }
  },
};
