import 'dotenv/config';
import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'delivery_pickup',
  DB_USER = 'postgres',
  DB_PASS = 'postgres',
} = process.env;

const DB_SSL = process.env.DB_SSL === '1' || process.env.DB_SSL === 'true';
let DB_SSL_CA = process.env.DB_SSL_CA;
const DB_SSL_CA_PATH = process.env.DB_SSL_CA_PATH;
let caPathResolved = DB_SSL_CA_PATH ? path.resolve(DB_SSL_CA_PATH) : null;
if (!DB_SSL_CA && caPathResolved && fs.existsSync(caPathResolved)) {
  DB_SSL_CA = fs.readFileSync(caPathResolved, { encoding: 'utf8' });
}

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: DB_SSL ? {
    ssl: {
      require: true,
      rejectUnauthorized: true,
      ca: DB_SSL_CA ? [DB_SSL_CA] : undefined,
    },
  } : {},
});

(async () => {
  try {
  console.log('SSL on?', DB_SSL, 'CA bytes:', DB_SSL_CA ? DB_SSL_CA.length : 0, 'CA path:', caPathResolved);
    await sequelize.authenticate();
    console.log('Sequelize connected OK');
  } catch (e) {
    console.error('Sequelize failed:', e);
  } finally {
    await sequelize.close();
  }
})();
