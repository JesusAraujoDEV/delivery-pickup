import { Router } from 'express';
import * as controller from '../controllers/thresholds.controller.js';

const router = Router();

router.get('/thresholds', controller.list);

export default router;
