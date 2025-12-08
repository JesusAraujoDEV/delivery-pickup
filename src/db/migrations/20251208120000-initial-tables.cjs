'use strict';

const { ZONES_TABLE, ZonesSchema } = require('../models/zones_model.cjs');
const { THRESHOLDS_TABLE, ThresholdsSchema } = require('../models/thresholds_model.cjs');
const { MANAGERS_TABLE, ManagersSchema } = require('../models/managers_model.cjs');
const { NOTES_TABLE, NotesSchema } = require('../models/notes_model.cjs');
const { NOTE_ITEMS_TABLE, NoteItemsSchema } = require('../models/note_items_model.cjs');
const { LOGS_TABLE, LogsSchema } = require('../models/logs_model.cjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Core tables
    await queryInterface.createTable(ZONES_TABLE, ZonesSchema);
    await queryInterface.createTable(THRESHOLDS_TABLE, ThresholdsSchema);
    await queryInterface.createTable(MANAGERS_TABLE, ManagersSchema);
    await queryInterface.createTable(NOTES_TABLE, NotesSchema);
    await queryInterface.createTable(NOTE_ITEMS_TABLE, NoteItemsSchema);
    await queryInterface.createTable(LOGS_TABLE, LogsSchema);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(LOGS_TABLE);
    await queryInterface.dropTable(NOTE_ITEMS_TABLE);
    await queryInterface.dropTable(NOTES_TABLE);
    await queryInterface.dropTable(MANAGERS_TABLE);
    await queryInterface.dropTable(THRESHOLDS_TABLE);
    await queryInterface.dropTable(ZONES_TABLE);
  }
};