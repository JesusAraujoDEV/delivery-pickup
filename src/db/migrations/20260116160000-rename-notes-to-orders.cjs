'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Rename legacy tables to the new naming.
    // This is defensive: if running on a fresh DB (already created with dp_orders), it no-ops.
    const tableExists = async (name) => {
      try {
        await queryInterface.describeTable(name);
        return true;
      } catch (_) {
        return false;
      }
    };

    const hasNotes = await tableExists('dp_notes');
    const hasOrders = await tableExists('dp_orders');
    if (hasNotes && !hasOrders) {
      await queryInterface.renameTable('dp_notes', 'dp_orders');
    }

    const hasNoteItems = await tableExists('dp_note_items');
    const hasOrderItems = await tableExists('dp_order_items');
    if (hasNoteItems && !hasOrderItems) {
      await queryInterface.renameTable('dp_note_items', 'dp_order_items');
    }

    // Optional: rename index if it exists (ignore errors).
    try {
      await queryInterface.renameIndex('dp_orders', 'idx_dp_notes_zone_id', 'idx_dp_orders_zone_id');
    } catch (_) {
      // ignore
    }
  },

  async down(queryInterface, Sequelize) {
    const tableExists = async (name) => {
      try {
        await queryInterface.describeTable(name);
        return true;
      } catch (_) {
        return false;
      }
    };

    const hasOrders = await tableExists('dp_orders');
    const hasNotes = await tableExists('dp_notes');
    if (hasOrders && !hasNotes) {
      await queryInterface.renameTable('dp_orders', 'dp_notes');
    }

    const hasOrderItems = await tableExists('dp_order_items');
    const hasNoteItems = await tableExists('dp_note_items');
    if (hasOrderItems && !hasNoteItems) {
      await queryInterface.renameTable('dp_order_items', 'dp_note_items');
    }

    try {
      await queryInterface.renameIndex('dp_notes', 'idx_dp_orders_zone_id', 'idx_dp_notes_zone_id');
    } catch (_) {
      // ignore
    }
  },
};
