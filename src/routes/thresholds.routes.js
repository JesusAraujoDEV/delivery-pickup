import { Router } from 'express';
import * as controller from '../controllers/thresholds.controller.js';

const router = Router();

router.get('/thresholds', controller.list);
router.post('/thresholds', controller.create);
router.get('/thresholds/:threshold_id', controller.get);

export default router;
