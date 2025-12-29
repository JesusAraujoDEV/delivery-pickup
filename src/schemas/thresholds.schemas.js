import Joi from 'joi';
import { VALID_METRICS } from '../utils/constants.js';

export const createThresholdSchema = Joi.object({
  metric_affected: Joi.string()
    .valid(...VALID_METRICS)
    .required(),
  value_critical: Joi.number().integer().required(),
  is_active: Joi.boolean().optional(),
});

export const thresholdIdParamSchema = Joi.object({
  threshold_id: Joi.string().guid({ version: ['uuidv4'] }).required(),
});

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
