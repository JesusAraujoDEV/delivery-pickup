import { Router } from 'express';
import catalogRoutes from './catalog.routes.js';
import orderRoutes from './orders.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import webhookRoutes from './webhooks.routes.js';
import reportRoutes from './reports.routes.js';
import thresholdsRoutes from './thresholds.routes.js';
import zonesRoutes from './zones.routes.js';
import logsRoutes from './logs.routes.js';
import authRoutes from './auth.routes.js';
import alertsRoutes from './alerts.routes.js';

const router = Router();

router.use('/catalog', catalogRoutes);
router.use('/orders', orderRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/reports', reportRoutes);
router.use('/', thresholdsRoutes);
router.use('/', alertsRoutes);
router.use('/', logsRoutes);
router.use('/zones', zonesRoutes);
router.use('/auth', authRoutes);

export default router;
