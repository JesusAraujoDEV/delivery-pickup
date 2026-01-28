import express from 'express';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { initSequelize, sequelize } from './config/sequelize.js';
import { mountSwagger } from './swagger/swagger.js';
import cors from 'cors';
import env from './config/config.js';
import { useMetrex } from 'metrex';
import { decodeJwtAlways } from './middlewares/jwt.middleware.js';
import { auditNonGetActions } from './middlewares/audit-logs.middleware.js';
import requestOriginLogger from './middlewares/request-origin.middleware.js';

dotenv.config();

const app = express();

app.use("/" , (req, res, next) => {
  res.message = "Welcome to the API";
  next();
});
app.use(express.json());

// Decode/verify JWT on every request (if Authorization header is present)
app.use(decodeJwtAlways);

// Startup debug: log presence (not values) of critical env vars to help platform debugging.
console.log('Startup env presence:', JSON.stringify({
  PORT: !!process.env.PORT,
  NODE_ENV: !!process.env.NODE_ENV,
  DB_HOST: !!process.env.DB_HOST,
  DB_NAME: !!process.env.DB_NAME,
  DB_USER: !!process.env.DB_USER,
  SECRET_KEY: !!process.env.SECRET_KEY,
  KITCHEN_BASE_URL: !!process.env.KITCHEN_BASE_URL,
}));

// Create audit log entry for every non-GET action under /api/dp/v1
app.use(auditNonGetActions);

// Globally instrument and mount the Metrex dashboard at /metrex
// Returns helper methods for custom metrics
const metrex = useMetrex(app, { routePath: '/metrex' });
app.locals.metrex = metrex;

// CORS based on whitelist from env
const whitelist = env.corsWhitelist;
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Log origin and endpoint for every incoming request
app.use(requestOriginLogger);

// Basic health check
app.get('/health', (req, res) => res.json({ ok: true }));

// Metrex demo endpoints
app.get('/hello', (req, res) => res.json({ ok: true }));

app.post('/buy', (req, res) => {
  // Example: Increment a custom counter
  metrex.counter('items_sold', 1, 'Total items sold');

  // Example: Set a gauge value
  metrex.gauge('queue_size', 5, 'Items currently in queue');

  res.json({ ok: true });
});

// Swagger docs (separado de lógica de negocio)
mountSwagger(app);

// API routes
app.use('/api/dp/v1', routes);

const PORT = process.env.PORT || 3000;

async function start() {
  console.log('Starting Sequelize initialization...');
  try {
    await initSequelize();
    console.log('Sequelize initialized successfully');
  } catch (e) {
    console.error('Sequelize initialization failed', e && e.message ? e.message : e);
    throw e;
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Service ready');
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, closing server...');
    try {
      await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
      if (sequelize) await sequelize.close();
      console.log('Shutdown complete');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown', err);
      process.exit(1);
    }
  });

  process.on('SIGINT', async () => {
    console.log('Received SIGINT, exiting...');
    process.kill(process.pid, 'SIGTERM');
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
});
