import { Router } from 'express';
import * as controller from '../controllers/thresholds.controller.js';
import { validate, validateParams, createThresholdSchema, thresholdIdSchema } from '../schemas/thresholds.schemas.js';

const router = Router();

router.get('/thresholds', controller.list);
router.post('/thresholds', validate(createThresholdSchema), controller.create);
router.get('/thresholds/:threshold_id', validateParams(thresholdIdSchema), controller.get);

export default router;
