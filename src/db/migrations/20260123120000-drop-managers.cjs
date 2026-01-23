'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Postgres-only project: use IF EXISTS guards for safety across environments.
    await queryInterface.sequelize.query('ALTER TABLE IF EXISTS dp_logs DROP CONSTRAINT IF EXISTS dp_logs_manager_id_fkey;');
    await queryInterface.sequelize.query('ALTER TABLE IF EXISTS dp_logs DROP COLUMN IF EXISTS manager_id;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS dp_managers;');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS dp_managers (
        manager_id UUID PRIMARY KEY,
        user_id UUID NOT NULL UNIQUE,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE
      );
    `);

    await queryInterface.sequelize.query('ALTER TABLE IF EXISTS dp_logs ADD COLUMN IF NOT EXISTS manager_id UUID;');

    // Add FK back (guarded; Postgres doesn't support IF NOT EXISTS for constraints)
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        ALTER TABLE dp_logs
          ADD CONSTRAINT dp_logs_manager_id_fkey
          FOREIGN KEY (manager_id)
          REFERENCES dp_managers (manager_id)
          ON UPDATE CASCADE
          ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN
          NULL;
      END $$;
    `);
  },
};
