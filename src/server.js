import express from 'express';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { initSequelize } from './config/sequelize.js';
import { mountSwagger } from './swagger/swagger.js';
import cors from 'cors';
import env from './config/config.js';
import { useMetrex } from 'metrex';

dotenv.config();

const app = express();
app.use(express.json());

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
  await initSequelize();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
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
