import * as service from '../services/thresholds.service.js';
import { createThresholdSchema, thresholdIdParamSchema } from '../schemas/thresholds.schemas.js';

export async function list(req, res) {
  try {
    const data = await service.list();
    res.json(data);
  } catch (err) {
    console.error('thresholds.list error', err);
    res.status(500).json({ message: 'Internal error' });
  }
}

export async function listActive(req, res) {
  try {
    const data = await service.listActive();
    res.json(data);
  } catch (err) {
    console.error('thresholds.listActive error', err);
    res.status(500).json({ message: 'Internal error' });
  }
}

export async function getByMetric(req, res) {
  try {
    const { metric_affected } = req.params;
    const data = await service.getByMetric(metric_affected);
    if (!data) return res.status(404).json({ message: 'Threshold not found' });
    res.json(data);
  } catch (err) {
    console.error('thresholds.getByMetric error', err);
    res.status(500).json({ message: 'Internal error' });
  }
}

export async function get(req, res) {
  try {
    const { threshold_id } = req.params;
    // Validate path param
    const { error: paramError } = thresholdIdParamSchema.validate({ threshold_id });
    if (paramError) {
      return res.status(400).json({ message: 'Invalid threshold_id', details: paramError.details });
    }
    const data = await service.getById(threshold_id);
    if (!data) return res.status(404).json({ message: 'Threshold not found' });
    res.json(data);
  } catch (err) {
    console.error('thresholds.get error', err);
    res.status(500).json({ message: 'Internal error' });
  }
}

export async function activate(req, res) {
  try {
    const { threshold_id } = req.params;
    const data = await service.setActive(threshold_id, true);
    if (!data) return res.status(404).json({ message: 'Threshold not found' });
    res.json(data);
  } catch (err) {
    console.error('thresholds.activate error', err);
    res.status(500).json({ message: 'Internal error' });
  }
}

export async function deactivate(req, res) {
  try {
    const { threshold_id } = req.params;
    const data = await service.setActive(threshold_id, false);
    if (!data) return res.status(404).json({ message: 'Threshold not found' });
    res.json(data);
  } catch (err) {
    console.error('thresholds.deactivate error', err);
    res.status(500).json({ message: 'Internal error' });
  }
}

export async function remove(req, res) {
  try {
    const { threshold_id } = req.params;
    const ok = await service.remove(threshold_id);
    if (!ok) return res.status(404).json({ message: 'Threshold not found' });
    res.status(204).send();
  } catch (err) {
    console.error('thresholds.remove error', err);
    res.status(500).json({ message: 'Internal error' });
  }
}

export async function create(req, res) {
  try {
    // Validate body payload with Joi
    const { value: payload, error } = createThresholdSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Invalid payload', details: error.details });
    }
    const created = await service.create(payload);
    res.status(201).json(created);
  } catch (err) {
    console.error('thresholds.create error', err);
    // handle unique constraint on metric_affected
    if (err && err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'metric_affected must be unique' });
    }
    res.status(500).json({ message: 'Internal error' });
  }
}

export async function update(req, res) {
  try {
    const { threshold_id } = req.params;
    const payload = req.body;

    const updated = await service.update(threshold_id, payload);
    if (!updated) return res.status(404).json({ message: 'Threshold not found' });
    res.json(updated);
  } catch (err) {
    console.error('thresholds.update error', err);
    if (err && err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'metric_affected must be unique' });
    }
    res.status(500).json({ message: 'Internal error' });
  }
}

export default { list, listActive, getByMetric, get, activate, deactivate, remove, create, update };
