import { Router } from 'express';
import ctrl from '../controllers/orders.controller.js';
import {
	validate,
	validateParams,
	validateQuery,
	createOrderSchema,
	noteIdParamSchema,
	listOrdersQuerySchema,
	patchOrderSchema,
	assignOrderSchema,
} from '../schemas/orders.schemas.js';

const router = Router();

// Admin: listado general con filtros
router.get('/', validateQuery(listOrdersQuerySchema), ctrl.listOrders);

router.post('/', validate(createOrderSchema), ctrl.createOrder);
router.get('/:readable_id/status', ctrl.getAndAdvanceStatus);

// Admin: detalle / edición / asignación
router.get('/:note_id', validateParams(noteIdParamSchema), ctrl.getOrderDetail);
router.patch('/:note_id', validateParams(noteIdParamSchema), validate(patchOrderSchema), ctrl.patchOrder);
router.patch('/:note_id/assign', validateParams(noteIdParamSchema), validate(assignOrderSchema), ctrl.assignOrder);

router.post('/:note_id/approve', ctrl.approveOrder);
router.post('/:note_id/cancel', ctrl.cancelOrder);
router.put('/:note_id/dispatch', ctrl.dispatchOrder);
router.put('/:note_id/close', ctrl.closeOrder);

export default router;
