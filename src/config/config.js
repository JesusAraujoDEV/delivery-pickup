import 'dotenv/config';
import fs from 'fs';
import path from 'path';

// Centralized app configuration sourced from .env
// Includes CA certificate handling via DB_SSL_CA (inline) or DB_SSL_CA_PATH (file path)

// function resolveCaFromEnv() {
//   // Support both DB_SSL_CA and POSTGRES_CA_CERT for inline CA
//   // let ca = process.env.DB_SSL_CA || process.env.POSTGRES_CA_CERT || null;
//   const caPathEnv = process.env.DB_SSL_CA_PATH;
//   const defaultPath = path.join(process.cwd(), 'certs', 'aiven-ca.pem');
//   const candidatePath = caPathEnv ? path.resolve(caPathEnv) : defaultPath;
//   if (!ca && fs.existsSync(candidatePath)) {
//     ca = fs.readFileSync(candidatePath, 'utf8');
//   }
//   return ca;
// }

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  secretKey: process.env.SECRET_KEY || 'default-secret-change-in-production',
  // WARNING: JWT payload contains PII. Enable only for debugging.
  logJwtPayload: (process.env.LOG_JWT_PAYLOAD === '1' || process.env.LOG_JWT_PAYLOAD === 'true') ? true : false,
  corsWhitelist: (process.env.CORS_WHITELIST || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),
  backendUrl: process.env.BACKEND_URL || null,

  // Database
  db: {
    url: process.env.DB_URL || null,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    name: process.env.DB_NAME || 'delivery_pickup',
    user: process.env.DB_USER || 'postgres',
    pass: process.env.DB_PASS || 'postgres',
    ssl: (process.env.DB_SSL === '1' || process.env.DB_SSL === 'true') ? true : false,
    // sslCa: resolveCaFromEnv(),
  },
};

// Convenience: Build a postgres URL if not provided
export function buildPostgresUrl() {
  if (env.db.url) return env.db.url;
  const user = encodeURIComponent(env.db.user);
  const pass = encodeURIComponent(env.db.pass);
  return `postgres://${user}:${pass}@${env.db.host}:${env.db.port}/${env.db.name}`;
}

// Sequelize dialectOptions.ssl builder
export function buildSequelizeSslOptions() {
  if (!env.db.ssl) return undefined;
  const ca = env.db.sslCa;
  return {
    require: true,
    rejectUnauthorized: !!ca,
    ...(ca ? { ca } : {}),
  };
}

export default env;