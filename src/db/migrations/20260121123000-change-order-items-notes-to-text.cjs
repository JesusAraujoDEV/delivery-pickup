'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const changeIfExists = async (tableName) => {
      try {
        const desc = await queryInterface.describeTable(tableName);
        if (desc && desc.notes) {
          await queryInterface.changeColumn(tableName, 'notes', { type: Sequelize.TEXT, allowNull: true });
        }
      } catch (err) {
        // ignore if table doesn't exist
      }
    };

    await changeIfExists('dp_order_items');
    await changeIfExists('dp_note_items');
  },

  async down(queryInterface, Sequelize) {
    const revertIfExists = async (tableName) => {
      try {
        const desc = await queryInterface.describeTable(tableName);
        if (desc && desc.notes) {
          await queryInterface.changeColumn(tableName, 'notes', { type: Sequelize.STRING(255), allowNull: true });
        }
      } catch (err) {
        // ignore
      }
    };

    await revertIfExists('dp_order_items');
    await revertIfExists('dp_note_items');
  },
};
