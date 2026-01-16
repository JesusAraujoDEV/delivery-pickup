import { Router } from 'express';
import ctrl from '../controllers/orders.controller.js';
import { authorize } from '../middlewares/auth.middleware.js';
import {
	validate,
	validateOneOf,
	validateParams,
	validateQuery,
	createOrderSchema,
	kitchenLikeCreateOrderSchema,
	noteIdParamSchema,
	orderIdParamSchema,
	orderStatusParamSchema,
	listOrdersQuerySchema,
	listActiveOrdersQuerySchema,
	patchOrderSchema,
	assignOrderSchema,
	setOrderStatusSchema,
} from '../schemas/orders.schemas.js';

const router = Router();

// Admin: listado general con filtros
router.get('/', validateQuery(listOrdersQuerySchema), ctrl.listOrders);

// Admin: listado de órdenes activas (excluye CANCELLED y DELIVERED)
router.get('/active', validateQuery(listActiveOrdersQuerySchema), ctrl.listActiveOrders);

// Admin: listado por status (path param)
router.get('/status/:status', validateParams(orderStatusParamSchema), validateQuery(listActiveOrdersQuerySchema), ctrl.listOrdersByStatus);

router.post(
	'/',
	validateOneOf([createOrderSchema, kitchenLikeCreateOrderSchema]),
	ctrl.createOrder
);

// Estado por destino (note_id) - endpoint único
router.patch('/:note_id/status', validateParams(noteIdParamSchema), validate(setOrderStatusSchema), ctrl.setOrderStatus);

// Admin: detalle / edición / asignación
router.get('/:id', validateParams(orderIdParamSchema), ctrl.getOrderDetailFlexible);
router.patch('/:note_id', authorize('Notes_dp', 'Update'), validateParams(noteIdParamSchema), validate(patchOrderSchema), ctrl.patchOrder);
router.patch('/:note_id/assign', authorize('Logs_dp', 'Create'), validateParams(noteIdParamSchema), validate(assignOrderSchema), ctrl.assignOrder);

export default router;
