const fs = require('fs');
const path = require('path');
require('dotenv').config();

const {
  NODE_ENV = 'development',
  DB_URL,
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'delivery_pickup',
  DB_USER = 'postgres',
  DB_PASS = 'postgres',
} = process.env;

function buildUrl() {
  if (DB_URL) return DB_URL;
  const host = DB_HOST;
  const port = DB_PORT;
  const user = encodeURIComponent(DB_USER);
  const pass = encodeURIComponent(DB_PASS);
  const db = DB_NAME;
  return `postgres://${user}:${pass}@${host}:${port}/${db}`;
}

// SSL handling (works for both development and production when DB_SSL is enabled)
const DB_SSL = process.env.DB_SSL === '1' || process.env.DB_SSL === 'true';
let sslConfigCli = null;

if (DB_SSL) {
  let caCert = null;
  const envPath = process.env.DB_SSL_CA_PATH;
  const defaultCaPath = path.join(process.cwd(), 'certs', 'aiven-ca.pem');
  const candidatePath = envPath ? path.resolve(envPath) : defaultCaPath;

  if (fs.existsSync(candidatePath)) {
    caCert = fs.readFileSync(candidatePath, 'utf8');
    console.log('INFO: CA certificate loaded for Sequelize CLI from', candidatePath);
  } else if (process.env.DB_SSL_CA) {
    caCert = process.env.DB_SSL_CA;
    console.log('INFO: CA certificate loaded for Sequelize CLI from env DB_SSL_CA');
  } else {
    // If no CA provided, you can still connect to Aiven by disabling verification.
    // Prefer providing CA via certs/aiven-ca.pem.
    console.warn('WARN: No CA found. Falling back to ssl without verification for CLI.');
  }

  sslConfigCli = {
    require: true,
    // Reject if CA is provided; otherwise allow to proceed without verification.
    rejectUnauthorized: !!caCert,
    ...(caCert ? { ca: caCert } : {}),
  };
}

const base = {
  url: buildUrl(),
  dialect: 'postgres',
  username: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  host: DB_HOST,
  port: Number(DB_PORT),
};

const maskedUrl = String(base.url || '').replace(/:[^:]+@/, ':*****@');
console.log('INFO: Sequelize CLI will use DB URL:', maskedUrl);

module.exports = {
  dialect: 'postgres',
  url: base.url,
  development: {
    ...base,
    ...(sslConfigCli && { dialectOptions: { ssl: sslConfigCli } }),
  },
  test: {
    ...base,
    ...(sslConfigCli && { dialectOptions: { ssl: sslConfigCli } }),
  },
  production: {
    ...base,
    ...(sslConfigCli && { dialectOptions: { ssl: sslConfigCli } }),
  },
};