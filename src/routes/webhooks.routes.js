import { Router } from 'express';
import ctrl from '../controllers/webhooks.controller.js';

const router = Router();
router.post('/kitchen/ready', ctrl.kitchenReady);
export default router;
