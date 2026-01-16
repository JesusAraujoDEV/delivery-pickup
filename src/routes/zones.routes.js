import { Router } from 'express';
import * as controller from '../controllers/zones.controller.js';

const router = Router();

router.post('/', controller.create);
router.get('/', controller.list);
router.get('/active', controller.listActive);
router.get('/:zone_id', controller.getById);
router.put('/:zone_id', controller.update);
router.patch('/:zone_id/activate', controller.activate);
router.patch('/:zone_id/deactivate', controller.deactivate);
router.delete('/:zone_id', controller.remove);

export default router;
