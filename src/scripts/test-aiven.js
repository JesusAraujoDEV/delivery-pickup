import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

// Load CA from env inline or from path; do NOT hardcode secrets
let AIVEN_CA = process.env.DB_SSL_CA;
const CA_PATH = process.env.DB_SSL_CA_PATH || path.join(process.cwd(), 'certs', 'aiven-ca.pem');
if (!AIVEN_CA && fs.existsSync(CA_PATH)) {
  AIVEN_CA = fs.readFileSync(CA_PATH, 'utf8');
}

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true,
    ca: AIVEN_CA,
  },
};

async function main() {
  const client = new pg.Client(config);
  try {
    await client.connect();
    const { rows } = await client.query('SELECT VERSION()');
    console.log('Connected. PostgreSQL version:', rows[0].version);
  } catch (err) {
    console.error('Connection failed:', err.message);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch {}
  }
}

main();
