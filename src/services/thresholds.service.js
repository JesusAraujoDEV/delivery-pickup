import { getModels } from '../models/index.js';

export async function list() {
  const { Thresholds } = getModels();
  return Thresholds.findAll();
}

export default { list };
