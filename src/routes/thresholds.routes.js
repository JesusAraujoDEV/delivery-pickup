import { Router } from 'express';
import * as controller from '../controllers/thresholds.controller.js';
import Joi from 'joi';
import { validateBody, validateParams, createThresholdSchema, thresholdIdParamSchema } from '../schemas/thresholds.schemas.js';
import { authorize } from '../middlewares/auth.middleware.js';
import { VALID_METRICS } from '../utils/constants.js';

const router = Router();

router.get('/thresholds', controller.list);

// Important: specific routes before ":threshold_id" to avoid conflicts
router.get('/thresholds/active', controller.listActive);

router.get(
	'/thresholds/by-metric/:metric_affected',
	validateParams(Joi.object({ metric_affected: Joi.string().valid(...VALID_METRICS).required() })),
	controller.getByMetric,
);

router.post('/thresholds', authorize('Thresholds_dp', 'Create'), validateBody(createThresholdSchema), controller.create);

router.get('/thresholds/:threshold_id', validateParams(thresholdIdParamSchema), controller.get);

router.patch('/thresholds/:threshold_id/activate', authorize('Thresholds_dp', 'Update'), validateParams(thresholdIdParamSchema), controller.activate);
router.patch('/thresholds/:threshold_id/deactivate', authorize('Thresholds_dp', 'Update'), validateParams(thresholdIdParamSchema), controller.deactivate);
router.delete('/thresholds/:threshold_id', authorize('Thresholds_dp', 'Delete'), validateParams(thresholdIdParamSchema), controller.remove);

export default router;
