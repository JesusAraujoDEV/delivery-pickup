import { getModels } from '../models/index.js';
import { randomUUID } from 'crypto';

export async function list() {
  const { Thresholds } = getModels();
  return Thresholds.findAll();
}

export async function listActive() {
  const { Thresholds } = getModels();
  return Thresholds.findAll({ where: { is_active: true } });
}

export async function getByMetric(metric_affected) {
  const { Thresholds } = getModels();
  return Thresholds.findOne({ where: { metric_affected } });
}

export async function getById(threshold_id) {
  const { Thresholds } = getModels();
  return Thresholds.findByPk(threshold_id);
}

export async function setActive(threshold_id, is_active) {
  const { Thresholds } = getModels();
  const record = await Thresholds.findByPk(threshold_id);
  if (!record) return null;
  await record.update({ is_active });
  return record;
}

export async function remove(threshold_id) {
  const { Thresholds } = getModels();
  const record = await Thresholds.findByPk(threshold_id);
  if (!record) return null;
  await record.destroy();
  return true;
}

export async function create(payload) {
  const { Thresholds } = getModels();
  const threshold_id = randomUUID();
  const record = await Thresholds.create({ threshold_id, ...payload });
  return record;
}

export async function update(threshold_id, payload) {
  const { Thresholds } = getModels();
  const record = await Thresholds.findByPk(threshold_id);
  if (!record) return null;
  await record.update(payload);
  return record;
}

export default { list, listActive, getByMetric, getById, setActive, remove, create, update };
