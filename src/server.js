import express from 'express';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { initSequelize } from './config/sequelize.js';

dotenv.config();

const app = express();
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => res.json({ ok: true }));

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
