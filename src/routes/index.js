import { Router } from 'express';
import catalogRoutes from './catalog.routes.js';
import orderRoutes from './orders.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import webhookRoutes from './webhooks.routes.js';
import reportRoutes from './reports.routes.js';
import thresholdsRoutes from './thresholds.routes.js';
import notesRoutes from './notes.routes.js';
import zonesRoutes from './zones.routes.js';
import managersRoutes from './managers.routes.js';
import logsRoutes from './logs.routes.js';

const router = Router();

router.use('/catalog', catalogRoutes);
router.use('/orders', orderRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/reports', reportRoutes);
router.use('/', thresholdsRoutes);
router.use('/', notesRoutes);
router.use('/', logsRoutes);
router.use('/zones', zonesRoutes);
router.use('/managers', managersRoutes);

export default router;
