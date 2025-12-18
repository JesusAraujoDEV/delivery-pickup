import { Router } from 'express';
import * as controller from '../controllers/managers.controller.js';

const router = Router();

router.get('/by-user/:user_id', controller.getByUser);
router.put('/:manager_id', controller.update);
router.patch('/:manager_id/activate', controller.activate);
router.patch('/:manager_id/deactivate', controller.deactivate);
router.delete('/:manager_id', controller.remove);

export default router;
