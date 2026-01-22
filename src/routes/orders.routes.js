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
	orderIdParamSchema,
	orderStatusParamSchema,
	listOrdersQuerySchema,
	listActiveOrdersQuerySchema,
	patchOrderSchema,
	assignOrderSchema,
	setOrderStatusSchema,
	cancelOrderSchema,
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
	validateOneOf([createOrderSchema]),
	ctrl.createOrder
);

// Estado por destino (order_id) - endpoint único
router.patch('/:order_id/status', validateParams(orderIdParamSchema), validate(setOrderStatusSchema), ctrl.setOrderStatus);

// Acción: cancelar orden (UUID o DL-####)
router.post('/:id/cancel', validateParams(orderIdParamSchema), validate(cancelOrderSchema), ctrl.cancelOrder);
router.patch('/:id/cancel', validateParams(orderIdParamSchema), validate(cancelOrderSchema), ctrl.cancelOrder);

// Admin: detalle / edición / asignación
router.get('/:id', validateParams(orderIdParamSchema), ctrl.getOrderDetailFlexible);
router.patch('/:order_id', authorize('Notes_dp', 'Update'), validateParams(orderIdParamSchema), validate(patchOrderSchema), ctrl.patchOrder);
router.patch('/:order_id/assign', authorize('Logs_dp', 'Create'), validateParams(orderIdParamSchema), validate(assignOrderSchema), ctrl.assignOrder);

export default router;
