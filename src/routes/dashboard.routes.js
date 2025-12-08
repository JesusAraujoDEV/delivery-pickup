import { Router } from 'express';
import ctrl from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/orders', ctrl.listOrdersByStatus);

export default router;
