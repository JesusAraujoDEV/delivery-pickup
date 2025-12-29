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

export async function listActive(req, res, next) {
  try {
    const data = await zonesService.listActive();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { zone_id } = req.params;
    const payload = req.body;
    const updated = await zonesService.update(zone_id, payload);
    if (!updated) return res.status(404).json({ message: 'Zone not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function activate(req, res, next) {
  try {
    const { zone_id } = req.params;
    const updated = await zonesService.setActive(zone_id, true);
    if (!updated) return res.status(404).json({ message: 'Zone not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deactivate(req, res, next) {
  try {
    const { zone_id } = req.params;
    const updated = await zonesService.setActive(zone_id, false);
    if (!updated) return res.status(404).json({ message: 'Zone not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const { zone_id } = req.params;
    const deleted = await zonesService.remove(zone_id);
    if (!deleted) return res.status(404).json({ message: 'Zone not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export default { create, list, getById, listActive, update, activate, deactivate, remove };
