import { Router } from 'express';
import ctrl from '../controllers/orders.controller.js';
import { validate, createOrderSchema } from '../schemas/orders.schemas.js';

const router = Router();

router.post('/', validate(createOrderSchema), ctrl.createOrder);
router.get('/:readable_id/status', ctrl.getAndAdvanceStatus);
router.post('/:note_id/approve', ctrl.approveOrder);
router.post('/:note_id/cancel', ctrl.cancelOrder);
router.put('/:note_id/dispatch', ctrl.dispatchOrder);
router.put('/:note_id/close', ctrl.closeOrder);

export default router;
