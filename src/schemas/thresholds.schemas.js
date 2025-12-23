import Joi from 'joi';

export const createThresholdSchema = Joi.object({
  metric_affected: Joi.string().max(50).required(),
  value_critical: Joi.number().integer().required(),
  is_active: Joi.boolean().optional(),
});

export const thresholdIdSchema = Joi.object({
  threshold_id: Joi.string().uuid().required(),
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

export function validateParams(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Validation error', details: error.details });
    }
    req.params = value;
    next();
  };
}

export default { createThresholdSchema, thresholdIdSchema, validate, validateParams };
