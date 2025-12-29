import { Router } from 'express';
import ctrl from '../controllers/orders.controller.js';
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
router.get('/', validateQuery(listOrdersQuerySchema), ctrl.listOrders);

// Admin: listado de órdenes activas (excluye CANCELLED y DELIVERED)
router.get('/active', validateQuery(listActiveOrdersQuerySchema), ctrl.listActiveOrders);

router.post('/', validate(createOrderSchema), ctrl.createOrder);

// Estado por destino (note_id) - endpoint único
router.patch('/:note_id/status', validateParams(noteIdParamSchema), validate(setOrderStatusSchema), ctrl.setOrderStatus);

// Admin: detalle / edición / asignación
router.get('/:note_id', validateParams(noteIdParamSchema), ctrl.getOrderDetail);
router.patch('/:note_id', validateParams(noteIdParamSchema), validate(patchOrderSchema), ctrl.patchOrder);
router.patch('/:note_id/assign', validateParams(noteIdParamSchema), validate(assignOrderSchema), ctrl.assignOrder);

export default router;
