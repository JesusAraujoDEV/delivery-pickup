import * as service from '../services/thresholds.service.js';

export async function list(req, res) {
  try {
    const data = await service.list();
    res.json(data);
  } catch (err) {
    console.error('thresholds.list error', err);
    res.status(500).json({ message: 'Internal error' });
  }
}

export default { list };
