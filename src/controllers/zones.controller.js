import zonesService from '../services/zones.service.js';

export async function create(req, res, next) {
  try {
    const payload = req.body;
    const created = await zonesService.create(payload);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const data = await zonesService.list();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const { zone_id } = req.params;
    const zone = await zonesService.getById(zone_id);
    if (!zone) return res.status(404).json({ message: 'Zone not found' });
    res.json(zone);
  } catch (err) {
    next(err);
  }
}

export default { create, list, getById };
