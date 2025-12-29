import { Router } from 'express';
import ctrl from '../controllers/orders.controller.js';
import { authorize } from '../middlewares/auth.middleware.js';
import {
	validate,
	validateParams,
	validateQuery,
	createOrderSchema,
	noteIdParamSchema,
	listOrdersQuerySchema,
	listActiveOrdersQuerySchema,
	patchOrderSchema,
	assignOrderSchema,
	setOrderStatusSchema,
} from '../schemas/orders.schemas.js';

const router = Router();

// Admin: listado general con filtros
router.get('/', authorize('Notes_dp', 'Read'), validateQuery(listOrdersQuerySchema), ctrl.listOrders);

// Admin: listado de órdenes activas (excluye CANCELLED y DELIVERED)
router.get('/active', authorize('Notes_dp', 'Read'), validateQuery(listActiveOrdersQuerySchema), ctrl.listActiveOrders);

router.post('/', authorize('Notes_dp', 'Create'), validate(createOrderSchema), ctrl.createOrder);

// Estado por destino (note_id) - endpoint único
router.patch('/:note_id/status', authorize('Notes_dp', 'Update'), validateParams(noteIdParamSchema), validate(setOrderStatusSchema), ctrl.setOrderStatus);

// Admin: detalle / edición / asignación
router.get('/:note_id', authorize('Notes_dp', 'Read'), validateParams(noteIdParamSchema), ctrl.getOrderDetail);
router.patch('/:note_id', authorize('Notes_dp', 'Update'), validateParams(noteIdParamSchema), validate(patchOrderSchema), ctrl.patchOrder);
router.patch('/:note_id/assign', authorize('Logs_dp', 'Create'), validateParams(noteIdParamSchema), validate(assignOrderSchema), ctrl.assignOrder);

export default router;
