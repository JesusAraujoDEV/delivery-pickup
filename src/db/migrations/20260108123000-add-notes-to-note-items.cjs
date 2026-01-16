'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = async (name) => {
      try {
        await queryInterface.describeTable(name);
        return true;
      } catch (_) {
        return false;
      }
    };

    const tableName = (await tableExists('dp_order_items'))
      ? 'dp_order_items'
      : 'dp_note_items';

    await queryInterface.addColumn(tableName, 'notes', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
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

    const tableName = (await tableExists('dp_order_items'))
      ? 'dp_order_items'
      : 'dp_note_items';

    await queryInterface.removeColumn(tableName, 'notes');
  },
};
