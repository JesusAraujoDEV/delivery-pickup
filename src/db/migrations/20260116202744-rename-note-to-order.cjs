'use strict';

/** @type {import('sequelize-cli').Migration} */

// Definimos los nombres de las tablas tal cual están en tu BD
const ORDERS_TABLE = 'dp_orders';
const ORDER_ITEMS_TABLE = 'dp_order_items';
const LOGS_TABLE = 'dp_logs';

module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * PASO 1: Renombrar PK en la tabla principal (dp_orders)
     * Cambiamos 'note_id' por 'order_id'
     */
    await queryInterface.renameColumn(ORDERS_TABLE, 'note_id', 'order_id');

    /**
     * PASO 2: Renombrar FK en la tabla de items (dp_order_items)
     * Cambiamos 'note_id' por 'order_id'.
     * OJO: Esto NO afecta a la columna 'notes', esa se queda intacta.
     */
    await queryInterface.renameColumn(ORDER_ITEMS_TABLE, 'note_id', 'order_id');

    /**
     * PASO 3: Renombrar FK en la tabla de logs (dp_logs)
     * Cambiamos 'note_id' por 'order_id'
     */
    await queryInterface.renameColumn(LOGS_TABLE, 'note_id', 'order_id');
  },

  async down (queryInterface, Sequelize) {
    /**
     * REVERTIR CAMBIOS
     * Si algo sale mal, volvemos a poner 'note_id'
     */
    
    // Revertir Logs
    await queryInterface.renameColumn(LOGS_TABLE, 'order_id', 'note_id');

    // Revertir Items
    await queryInterface.renameColumn(ORDER_ITEMS_TABLE, 'order_id', 'note_id');

    // Revertir Orders
    await queryInterface.renameColumn(ORDERS_TABLE, 'order_id', 'note_id');
  }
};