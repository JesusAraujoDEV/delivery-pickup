import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'delivery_pickup',
  DB_USER = 'postgres',
  DB_PASS = 'postgres',
  NODE_ENV = 'development',
} = process.env;

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: 'postgres',
  logging: NODE_ENV === 'development' ? console.log : false,
});

// Models
import defineModels from '../models/index.js';

export async function initSequelize() {
  defineModels(sequelize, DataTypes);
  await sequelize.authenticate();
  await sequelize.sync(); // For demo; in prod use migrations
}
