import { getModels } from '../models/index.js';
import * as thresholdsService from '../services/thresholds.service.js';
import { Op } from 'sequelize';

function utcDayRange(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
  return { start, end };
}

// Middleware para verificar capacidad de órdenes pendientes al crear
export async function checkPendingCapacityOnCreate(req, res, next) {
  try {
    const { Orders } = getModels();
    const t = await thresholdsService.getByMetric('CAPACIDAD_MAXIMA_ORDENES_PENDIENTES');
    if (!t || !t.is_active) return next();
    const { start, end } = utcDayRange();
    console.log('CapacityMiddleware: pending - using UTC day range', start.toISOString(), end.toISOString());
    const pendingCount = await Orders.count({ where: { current_status: 'PENDING_REVIEW', timestamp_creation: { [Op.gte]: start, [Op.lt]: end } } });
    if (pendingCount >= Number(t.value_critical)) {
      return res.status(429).json({ message: 'Capacity exceeded: pending orders limit reached', metric: t.metric_affected, limit: t.value_critical, current: pendingCount });
    }
    next();
  } catch (err) {
    next(err);
  }
}

// Middleware para verificar capacidades en transiciones de estado
export async function checkCapacityOnTransition(req, res, next) {
  try {
    const { Orders } = getModels();
    const status_to = (req.body && req.body.status) || (req.body && req.body.status_to) || null;
    if (!status_to) return next();

    // Need the order to inspect service_type
    const id = req.params.order_id || req.params.id;
    if (!id) return next();

    const order = await Orders.findOne({ where: { order_id: id } }) || await Orders.findOne({ where: { readable_id: id } });
    if (!order) return next();

    // When moving to IN_KITCHEN -> check CAPACIDAD_MAXIMA_ORDENES_COCINA
    if (status_to === 'IN_KITCHEN') {
      const t = await thresholdsService.getByMetric('CAPACIDAD_MAXIMA_ORDENES_COCINA');
      if (t && t.is_active) {
        const { start, end } = utcDayRange();
        const count = await Orders.count({ where: { current_status: 'IN_KITCHEN', timestamp_creation: { [Op.gte]: start, [Op.lt]: end } } });
        console.log(`CapacityMiddleware: checking IN_KITCHEN - threshold=${t.value_critical} active=${t.is_active} current=${count} order=${order.order_id} range=${start.toISOString()}..${end.toISOString()}`);
        if (count >= Number(t.value_critical)) {
          console.log('CapacityMiddleware: rejecting transition to IN_KITCHEN');
          return res.status(429).json({ message: 'Capacity exceeded: kitchen capacity reached', metric: t.metric_affected, limit: t.value_critical, current: count });
        }
      }
    }

    // Moving to READY_FOR_DISPATCH -> check dispatch capacity (pickup variant if applicable)
    if (status_to === 'READY_FOR_DISPATCH') {
      const metric = order.service_type === 'PICKUP' ? 'CAPACIDAD_MAXIMA_ORDENES_DESPACHO_PICKUP' : 'CAPACIDAD_MAXIMA_ORDENES_DESPACHO';
      const t = await thresholdsService.getByMetric(metric);
      if (t && t.is_active) {
        const { start, end } = utcDayRange();
        const count = await Orders.count({ where: { current_status: 'READY_FOR_DISPATCH', timestamp_creation: { [Op.gte]: start, [Op.lt]: end } } });
        console.log(`CapacityMiddleware: checking READY_FOR_DISPATCH (${metric}) - threshold=${t.value_critical} current=${count} order=${order.order_id} range=${start.toISOString()}..${end.toISOString()}`);
        if (count >= Number(t.value_critical)) {
          console.log('CapacityMiddleware: rejecting transition to READY_FOR_DISPATCH');
          return res.status(429).json({ message: 'Capacity exceeded: dispatch capacity reached', metric: t.metric_affected, limit: t.value_critical, current: count });
        }
      }
    }

    // Moving to EN_ROUTE -> check en ruta capacity for DELIVERY
    if (status_to === 'EN_ROUTE' && order.service_type === 'DELIVERY') {
      const t = await thresholdsService.getByMetric('CAPACIDAD_MAXIMA_ORDENES_EN_RUTA');
      if (t && t.is_active) {
        const { start, end } = utcDayRange();
        const count = await Orders.count({ where: { current_status: 'EN_ROUTE', timestamp_creation: { [Op.gte]: start, [Op.lt]: end } } });
        console.log(`CapacityMiddleware: checking EN_ROUTE - threshold=${t.value_critical} current=${count} order=${order.order_id} range=${start.toISOString()}..${end.toISOString()}`);
        if (count >= Number(t.value_critical)) {
          console.log('CapacityMiddleware: rejecting transition to EN_ROUTE');
          return res.status(429).json({ message: 'Capacity exceeded: en-route capacity reached', metric: t.metric_affected, limit: t.value_critical, current: count });
        }
      }
    }

    next();
  } catch (err) {
    next(err);
  }
}

export default { checkPendingCapacityOnCreate, checkCapacityOnTransition };
