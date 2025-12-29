import Joi from 'joi';
import ordersService from '../services/orders.service.js';

const itemSchema = Joi.object({
  product_id: Joi.string().required(),
  product_name: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  unit_price: Joi.number().precision(2).required(),
});

const createOrderSchema = Joi.object({
  service_type: Joi.string().valid('DELIVERY','PICKUP').required(),
  customer: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().email().optional(),
    address: Joi.string().allow('', null),
  }).required(),
  zone_id: Joi.string().guid({ version: 'uuidv4' }).optional(),
  items: Joi.array().items(itemSchema).min(1).required(),
  shipping_cost: Joi.number().precision(2).required(),
});

async function createOrder(req, res, next) {
  try {
    const payload = await createOrderSchema.validateAsync(req.body, { abortEarly: false });
    const order = await ordersService.createOrder(payload);
    res.status(201).json(order);
  } catch (err) {
    if (err.isJoi) return res.status(400).json({ message: 'Validation error', details: err.details });
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
    next(err);
  }
}

export default {
  createOrder,
  listOrders,
  getOrderDetail,
  patchOrder,
  assignOrder,
  setOrderStatus,
};
