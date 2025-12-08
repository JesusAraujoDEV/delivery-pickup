import { Router } from 'express';
import catalogRoutes from './catalog.routes.js';
import orderRoutes from './orders.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import webhookRoutes from './webhooks.routes.js';
import reportRoutes from './reports.routes.js';

const router = Router();

router.use('/catalog', catalogRoutes);
router.use('/orders', orderRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/reports', reportRoutes);

export default router;
