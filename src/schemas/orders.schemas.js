import Joi from 'joi';

export const noteIdParamSchema = Joi.object({
  note_id: Joi.string().guid({ version: ['uuidv4'] }).required(),
});

export const listOrdersQuerySchema = Joi.object({
  status: Joi.string()
    .valid('PENDING_REVIEW', 'IN_KITCHEN', 'READY_FOR_DISPATCH', 'EN_ROUTE', 'DELIVERED', 'CANCELLED')
    .optional(),
  date: Joi.alternatives()
    .try(Joi.string().valid('today'), Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
});

// Igual que listOrdersQuerySchema, pero sin status: este endpoint siempre excluye DELIVERED y CANCELLED
export const listActiveOrdersQuerySchema = Joi.object({
  date: Joi.alternatives()
    .try(Joi.string().valid('today'), Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
});

export const patchOrderSchema = Joi.object({
  customer: Joi.object({
    name: Joi.string().optional(),
    phone: Joi.string().optional(),
    email: Joi.string().email().optional(),
    address: Joi.string().allow('', null).optional(),
  }).optional(),
  zone_id: Joi.string().guid({ version: ['uuidv4'] }).allow(null).optional(),
  // también permitimos editar campos directos (si el frontend manda la forma “Notes”)
  customer_name: Joi.string().optional(),
  customer_phone: Joi.string().optional(),
  customer_email: Joi.string().email().allow(null, '').optional(),
  delivery_address: Joi.string().allow(null, '').optional(),
  monto_total: Joi.number().precision(2).min(0).optional(),
  monto_costo_envio: Joi.number().precision(2).min(0).optional(),
  service_type: Joi.string().valid('DELIVERY', 'PICKUP').optional(),
  current_status: Joi.string().valid('PENDING_REVIEW', 'IN_KITCHEN', 'READY_FOR_DISPATCH', 'EN_ROUTE', 'DELIVERED', 'CANCELLED').optional(),
}).min(1);

export const assignOrderSchema = Joi.object({
  // Placeholder: en este proyecto no hay tabla drivers.
  // Usamos manager_id para registrar en logs quién hizo la asignación.
  manager_id: Joi.string().guid({ version: ['uuidv4'] }).optional(),
  note: Joi.string().max(500).optional(),
}).min(1);

export const orderItemSchema = Joi.object({
  product_id: Joi.string().required(),
  product_name: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  unit_price: Joi.number().precision(2).min(0).required(),
});

export const customerSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().required(),
  email: Joi.string().email().required(),
  address: Joi.string().required(),
});

export const createOrderSchema = Joi.object({
  service_type: Joi.string().valid('DELIVERY', 'PICKUP').required(),
  customer: customerSchema.required(),
  items: Joi.array().items(orderItemSchema).min(1).required(),
  shipping_cost: Joi.number().precision(2).min(0).optional(),
});

export const orderStatusSchema = Joi.object({
  status: Joi.string().valid(
    'PENDING_REVIEW',
    'IN_KITCHEN',
    'READY_FOR_DISPATCH',
    'EN_ROUTE',
    'DELIVERED',
    'CANCELLED'
  ).required(),
});

// Matriz de transición de estados permitidos
export const VALID_TRANSITIONS = {
  PENDING_REVIEW: ['IN_KITCHEN', 'CANCELLED'],
  IN_KITCHEN: ['READY_FOR_DISPATCH', 'CANCELLED'],
  READY_FOR_DISPATCH: ['EN_ROUTE', 'DELIVERED', 'CANCELLED'],
  EN_ROUTE: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

// Para endpoint PATCH /orders/{note_id}/status
export const setOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('PENDING_REVIEW', 'IN_KITCHEN', 'READY_FOR_DISPATCH', 'EN_ROUTE', 'DELIVERED', 'CANCELLED')
    .required(),
}).required();

export function validate(schema) {
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

export function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Invalid query', details: error.details });
    }
    req.query = value;
    next();
  };
}
