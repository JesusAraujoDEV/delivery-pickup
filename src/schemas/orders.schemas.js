import Joi from 'joi';

export const orderIdParamSchema = Joi.object({
  // Algunos endpoints usan :id (detalle flexible) y otros :order_id (UUID estrictamente)
  // Para evitar drift entre rutas/Swagger, aceptamos cualquiera de los dos.
  id: Joi.alternatives().try(Joi.string().guid({ version: ['uuidv4'] }), Joi.string().pattern(/^DL-\d+$/)),
  order_id: Joi.alternatives().try(Joi.string().guid({ version: ['uuidv4'] }), Joi.string().pattern(/^DL-\d+$/)),
})
  .xor('id', 'order_id')
  .required();

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
  // también permitimos editar campos directos (si el frontend manda la forma “Orders”)
  customer_name: Joi.string().optional(),
  customer_phone: Joi.string().optional(),
  customer_email: Joi.string().email().allow(null, '').optional(),
  delivery_address: Joi.string().allow(null, '').optional(),
  monto_total: Joi.number().precision(2).min(0).optional(),
  monto_costo_envio: Joi.number().precision(2).min(0).optional(),
  service_type: Joi.string().valid('DELIVERY', 'PICKUP').optional(),
  current_status: Joi.string().valid('PENDING_REVIEW', 'IN_KITCHEN', 'READY_FOR_DISPATCH', 'EN_ROUTE', 'DELIVERED', 'CANCELLED').optional(),
  payment_reference: Joi.string().allow(null, '').optional(),
  payment_type: Joi.string().valid('EFECTIVO', 'DIGITAL').optional(),
  payment_received: Joi.boolean().optional(),
}).min(1);

export const assignOrderSchema = Joi.object({
  // Placeholder: en este proyecto no hay tabla drivers.
  // La auditoría queda registrada por JWT en Logs.manager_display.
  note: Joi.string().max(500).optional(),
}).min(1);

export const orderItemSchema = Joi.object({
  product_id: Joi.string().required(),
  product_name: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  unit_price: Joi.number().precision(2).min(0).required(),
  notes: Joi.alternatives().try(Joi.string(), Joi.array(), Joi.object()).allow('', null).optional(),
});

export const customerSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().required(),
  email: Joi.string().email().required(),
  address: Joi.string().required(),
});

export const createOrderSchema = Joi.object({
  service_type: Joi.string().valid('DELIVERY', 'PICKUP').required(),
  zone_id: Joi.string().guid({ version: ['uuidv4'] }).optional(),
  customer: customerSchema.optional(),
  items: Joi.array().items(orderItemSchema).min(1).required(),
  // Nota: se acepta opcionalmente pero el backend lo calcula desde la zona.
  shipping_cost: Joi.number().precision(2).min(0).optional(),
  payment_reference: Joi.string().allow(null, '').optional(),
  payment_type: Joi.string().valid('EFECTIVO', 'DIGITAL').optional(),
  payment_received: Joi.boolean().optional(),
});

// Payload pedido (Kitchen-like)
export const kitchenLikeCreateOrderSchema = Joi.object({
  externalOrderId: Joi.string().required(),
  sourceModule: Joi.string().required(),
  serviceMode: Joi.string().required(),
  displayLabel: Joi.string().required(),
  customerName: Joi.string().required(),
  zone_id: Joi.string().guid({ version: ['uuidv4'] }).required(),
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        notes: Joi.alternatives().try(Joi.string(), Joi.array(), Joi.object()).allow('', null).optional(),
      })
    )
    .min(1)
    .required(),
  payment_reference: Joi.string().allow(null, '').optional(),
  payment_type: Joi.string().valid('EFECTIVO', 'DIGITAL').optional(),
  payment_received: Joi.boolean().optional(),
}).required();

export function validateOneOf(schemas) {
  return (req, res, next) => {
    const errors = [];
    for (const schema of schemas) {
      const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
      if (!error) {
        req.body = value;
        return next();
      }
      errors.push(error);
    }

    return res.status(400).json({
      message: 'Validation error',
      details: errors[0]?.details || [],
    });
  };
}

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

export const orderStatusParamSchema = Joi.object({
  status: Joi.string()
    .valid('PENDING_REVIEW', 'IN_KITCHEN', 'READY_FOR_DISPATCH', 'EN_ROUTE', 'DELIVERED', 'CANCELLED')
    .required(),
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

// Para endpoint PATCH /orders/{order_id}/status
export const setOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('PENDING_REVIEW', 'IN_KITCHEN', 'READY_FOR_DISPATCH', 'EN_ROUTE', 'DELIVERED', 'CANCELLED')
    .required(),
  payment_received: Joi.boolean().optional(),
  payment_reference: Joi.string().allow(null, '').optional(),
  payment_type: Joi.string().valid('EFECTIVO', 'DIGITAL').optional(),
}).required();

// Para endpoint POST/PATCH /orders/{id}/cancel
export const cancelOrderSchema = Joi.object({
  reason_cancelled: Joi.string().trim().max(500).required(),
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
