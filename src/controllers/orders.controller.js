import ordersService from '../services/orders.service.js';

async function createOrder(req, res, next) {
  try {
    // La validación de payload se hace en la ruta con `validateOneOf([createOrderSchema, kitchenLikeCreateOrderSchema])`
    // para evitar duplicidad y drift entre esquemas.
    const payload = req.body;
    const order = await ordersService.createOrder(payload);
    res.status(201).json(order);
  } catch (err) {
    if (err?.statusCode === 400) return res.status(400).json({ message: err.message, details: err.details });
    if (err?.statusCode === 502) return res.status(502).json({ message: err.message, details: err.details });
    next(err);
  }
}

// Admin: listado general
async function listOrders(req, res, next) {
  try {
    const { status, date } = req.query || {};
    const data = await ordersService.listOrders({ status, date });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// Admin: listado de órdenes activas (excluye CANCELLED y DELIVERED)
async function listActiveOrders(req, res, next) {
  try {
    const { date } = req.query || {};
    const data = await ordersService.listActiveOrders({ date });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// Admin: detalle completo por note_id
async function getOrderDetail(req, res, next) {
  try {
    const { note_id } = req.params;
    const data = await ordersService.getOrderDetail(note_id);
    if (!data) return res.status(404).json({ message: 'Order not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// Admin: patch de datos (corrección)
async function patchOrder(req, res, next) {
  try {
    const { note_id } = req.params;
    const updated = await ordersService.patchOrder(note_id, req.body);
    if (!updated) return res.status(404).json({ message: 'Order not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// Admin: asignación de motorizado (placeholder mientras no exista tabla drivers)
async function assignOrder(req, res, next) {
  try {
    const { note_id } = req.params;
    const data = await ordersService.assignOrder(note_id, req.body);
    if (!data) return res.status(404).json({ message: 'Order not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// Admin: cambio de estado por estado destino
async function setOrderStatus(req, res, next) {
  try {
    const { note_id } = req.params;
    const { status } = req.body;
    const data = await ordersService.setOrderStatus(note_id, status);
    if (!data) return res.status(404).json({ message: 'Order not found' });
    res.json(data);
  } catch (err) {
    if (err?.statusCode === 400) {
      return res.status(400).json({ message: err.message, details: err.details });
    }
    next(err);
  }
}

export default {
  createOrder,
  listOrders,
  listActiveOrders,
  getOrderDetail,
  patchOrder,
  assignOrder,
  setOrderStatus,
};
