import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'delivery_pickup',
  DB_USER = 'postgres',
  DB_PASS = 'postgres',
  NODE_ENV = 'development',
  DB_URL,
} = process.env;

// SSL configuration, mirroring Mediart backend approach
const DB_SSL = process.env.DB_SSL === '1' || process.env.DB_SSL === 'true';
let DB_SSL_CA = process.env.DB_SSL_CA || process.env.POSTGRES_CA_CERT; // optional: CA content from env (supports alias)
let DB_SSL_CA_PATH = process.env.DB_SSL_CA_PATH; // optional: path to CA file

// If in production and no explicit CA provided, try default project cert path (like Mediart's server/ca.crt)
if (NODE_ENV === 'production') {
  const defaultCaPath = path.join(process.cwd(), 'certs', 'aiven-ca.pem');
  if (fs.existsSync(defaultCaPath)) {
    DB_SSL_CA_PATH = defaultCaPath;
  }
}

// Resolve CA from path if present
if (!DB_SSL_CA && DB_SSL_CA_PATH) {
  try {
    const resolvedPath = path.isAbsolute(DB_SSL_CA_PATH)
      ? DB_SSL_CA_PATH
      : path.resolve(DB_SSL_CA_PATH);
    DB_SSL_CA = fs.readFileSync(resolvedPath, { encoding: 'utf8' });
    console.log('INFO: DB SSL CA loaded from file:', resolvedPath);
  } catch (e) {
    console.error('Failed to read DB SSL CA file:', DB_SSL_CA_PATH, e.message);
  }
}

// Build Sequelize options similar to Mediart
const options = {
  dialect: 'postgres',
  logging: NODE_ENV === 'development' ? console.log : false,
};

if (DB_SSL) {
  // If CA is available, use it; otherwise rely on system CAs but keep strict validation
  // Normalize CA to array to satisfy pg expectations in some environments
  const caOpt = DB_SSL_CA ? (Array.isArray(DB_SSL_CA) ? DB_SSL_CA : [DB_SSL_CA]) : undefined;
  options.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: !!caOpt,
      ca: caOpt,
    }
  };
}

// Support connection via URL (like Mediart's config.db_url) or via discrete params
export const sequelize = DB_URL
  ? new Sequelize(DB_URL, options)
  : new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: Number(DB_PORT),
    ...options,
  });

// Setup models (Mediart-style) from CommonJS files
const require = createRequire(import.meta.url);
const { setupModels } = require('../db/models/index.cjs');

export async function initSequelize() {
  setupModels(sequelize);
  await sequelize.authenticate();
  // Prefer migrations over sync. Uncomment for dev bootstrap only:
  // await sequelize.sync();
}
