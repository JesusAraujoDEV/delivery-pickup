import { Router } from 'express';
import * as controller from '../controllers/zones.controller.js';

const router = Router();

router.post('/zones', controller.create);
router.get('/zones', controller.list);
router.get('/zones/:zone_id', controller.getById);

export default router;
