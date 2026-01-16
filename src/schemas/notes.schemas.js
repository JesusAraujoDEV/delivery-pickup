import Joi from 'joi';

export const orderIdParamSchema = Joi.object({
  order_id: Joi.string().guid({ version: ['uuidv4'] }).required(),
});

export const itemIdParamSchema = Joi.object({
  item_id: Joi.string().guid({ version: ['uuidv4'] }).required(),
});

export const readableIdParamSchema = Joi.object({
  readable_id: Joi.string().trim().min(1).max(20).required(),
});

export const createOrderItemSchema = Joi.object({
  product_name: Joi.string().trim().min(1).max(150).required(),
  quantity: Joi.number().integer().min(1).required(),
  unit_price: Joi.number().precision(2).positive().required(),
  // subtotal es opcional; si no llega lo calculamos en el service
  subtotal: Joi.number().precision(2).positive().optional(),
});

export const patchOrderItemSchema = Joi.object({
  product_name: Joi.string().trim().min(1).max(150).optional(),
  quantity: Joi.number().integer().min(1).optional(),
  unit_price: Joi.number().precision(2).positive().optional(),
  subtotal: Joi.number().precision(2).positive().optional(),
}).min(1);

export const patchOrderSchema = Joi.object({
  // Permitimos actualizar datos principales sin tocar el flujo de órdenes.
  customer_name: Joi.string().trim().min(1).max(100).optional(),
  customer_phone: Joi.string().trim().min(1).max(20).optional(),
  customer_email: Joi.string().trim().email().max(100).allow(null, '').optional(),
  delivery_address: Joi.string().allow(null, '').optional(),
  service_type: Joi.string().valid('DELIVERY', 'PICKUP').optional(),
  current_status: Joi.string().trim().min(1).max(30).optional(),
  monto_total: Joi.number().precision(2).min(0).optional(),
  monto_costo_envio: Joi.number().precision(2).min(0).optional(),
  zone_id: Joi.string().guid({ version: ['uuidv4'] }).allow(null).optional(),
}).min(1);

export function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Validation error', details: error.details });
    }
    req.body = value;
    next();
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.params, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Invalid parameters', details: error.details });
    }
    next();
  };
}
