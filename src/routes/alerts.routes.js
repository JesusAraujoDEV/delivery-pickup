import { Router } from 'express';
import * as controller from '../controllers/alerts.controller.js';

const router = Router();

// GET /alerts - lista alertas actuales basadas en thresholds de tiempo
router.get('/alerts', controller.listAlerts);

export default router;
