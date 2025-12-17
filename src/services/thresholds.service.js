import { getModels } from '../models/index.js';
import { randomUUID } from 'crypto';

export async function list() {
  const { Thresholds } = getModels();
  return Thresholds.findAll();
}

export async function getById(threshold_id) {
  const { Thresholds } = getModels();
  return Thresholds.findByPk(threshold_id);
}

export async function create(payload) {
  const { Thresholds } = getModels();
  const threshold_id = randomUUID();
  const record = await Thresholds.create({ threshold_id, ...payload });
  return record;
}

export default { list, getById, create };
