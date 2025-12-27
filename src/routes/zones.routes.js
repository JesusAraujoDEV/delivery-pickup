import { Router } from 'express';
import * as controller from '../controllers/zones.controller.js';

const router = Router();

router.post('/zones', controller.create);
router.get('/zones', controller.list);
router.get('/zones/active', controller.listActive);
router.get('/zones/:zone_id', controller.getById);
router.put('/zones/:zone_id', controller.update);
router.patch('/zones/:zone_id/activate', controller.activate);
router.patch('/zones/:zone_id/deactivate', controller.deactivate);
router.delete('/zones/:zone_id', controller.remove);

export default router;
