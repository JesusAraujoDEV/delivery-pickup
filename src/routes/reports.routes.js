import { Router } from 'express';
import ctrl from '../controllers/reports.controller.js';

const router = Router();
router.get('/export', ctrl.exportReport);
export default router;
