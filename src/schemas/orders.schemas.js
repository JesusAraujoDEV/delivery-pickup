import Joi from 'joi';

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
