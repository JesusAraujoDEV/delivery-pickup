import * as managersService from '../services/managers.service.js';

export async function create(req, res, next) {
  try {
    const payload = req.body;
    const created = await managersService.create(payload);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const items = await managersService.list();
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const { manager_id } = req.params;
    const manager = await managersService.getById(manager_id);
    if (!manager) return res.status(404).json({ message: 'Manager not found' });
    res.json(manager);
  } catch (err) {
    next(err);
  }
}

export async function getByUser(req, res, next) {
  try {
    const { user_id } = req.params;
    const manager = await managersService.getByUser(user_id);
    if (!manager) return res.status(404).json({ message: 'Manager not found' });
    res.json(manager);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { manager_id } = req.params;
    const payload = req.body;
    const updated = await managersService.update(manager_id, payload);
    if (!updated) return res.status(404).json({ message: 'Manager not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function activate(req, res, next) {
  try {
    const { manager_id } = req.params;
    const updated = await managersService.activate(manager_id);
    if (!updated) return res.status(404).json({ message: 'Manager not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deactivate(req, res, next) {
  try {
    const { manager_id } = req.params;
    const updated = await managersService.deactivate(manager_id);
    if (!updated) return res.status(404).json({ message: 'Manager not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const { manager_id } = req.params;
    const deleted = await managersService.remove(manager_id);
    if (!deleted) return res.status(404).json({ message: 'Manager not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export default { create, list, getById, getByUser, update, activate, deactivate, remove };
