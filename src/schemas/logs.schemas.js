import Joi from 'joi';

export const logIdParamSchema = Joi.object({
  log_id: Joi.string().guid({ version: ['uuidv4'] }).required(),
});

export const orderIdParamSchema = Joi.object({
  order_id: Joi.string().guid({ version: ['uuidv4'] }).required(),
});

export const logsSearchQuerySchema = Joi.object({
  // Filtra por resource (orders, zones, thresholds)
  resource: Joi.string()
    .valid('orders', 'zones', 'thresholds')
    .optional(),

  // Filtra por status_to (estado destino). Se suele usar para auditoría.
  status: Joi.string()
    .valid('PENDING_REVIEW', 'IN_KITCHEN', 'READY_FOR_DISPATCH', 'EN_ROUTE', 'DELIVERED', 'CANCELLED', 'ACTION')
    .optional(),

  // Rango de fechas (timestamp_transition)
  from: Joi.string().isoDate().optional(),
  to: Joi.string().isoDate().optional(),

  // Limitar
  limit: Joi.number().integer().min(1).max(500).default(50),
  offset: Joi.number().integer().min(0).default(0),
}).unknown(false);

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
