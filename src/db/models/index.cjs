const { Zones, ZonesSchema } = require('./zones_model.cjs');
const { Thresholds, ThresholdsSchema } = require('./thresholds_model.cjs');
const { Managers, ManagersSchema } = require('./managers_model.cjs');
const { Notes, NotesSchema } = require('./notes_model.cjs');
const { NoteItems, NoteItemsSchema } = require('./note_items_model.cjs');
const { Logs, LogsSchema } = require('./logs_model.cjs');

function setupModels(sequelize) {
  Zones.init(ZonesSchema, Zones.config(sequelize));
  Thresholds.init(ThresholdsSchema, Thresholds.config(sequelize));
  Managers.init(ManagersSchema, Managers.config(sequelize));
  Notes.init(NotesSchema, Notes.config(sequelize));
  NoteItems.init(NoteItemsSchema, NoteItems.config(sequelize));
  Logs.init(LogsSchema, Logs.config(sequelize));

  Zones.associate(sequelize.models);
  Thresholds.associate?.(sequelize.models);
  Managers.associate(sequelize.models);
  Notes.associate(sequelize.models);
  NoteItems.associate(sequelize.models);
  Logs.associate(sequelize.models);
}

module.exports = { setupModels };