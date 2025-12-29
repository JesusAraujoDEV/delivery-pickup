import { getModels } from '../models/index.js';
import { randomUUID } from 'crypto';

export async function create(payload) {
  const { Managers } = getModels();
  try {
    const manager = await Managers.create({
      manager_id: randomUUID(),
      ...payload,
    });
    return manager;
  } catch (err) {
    // Unique constraint on user_id
    if (err?.name === 'SequelizeUniqueConstraintError') {
      err.statusCode = 409;
      err.message = 'user_id must be unique';
    }
    throw err;
  }
}

export async function list() {
  const { Managers } = getModels();
  return Managers.findAll();
}

export async function getById(manager_id) {
  const { Managers } = getModels();
  return Managers.findByPk(manager_id);
}

export async function getByUser(user_id) {
  const { Managers } = getModels();
  return Managers.findOne({ where: { user_id } });
}

export async function update(manager_id, payload) {
  const { Managers } = getModels();
  await Managers.update(payload, { where: { manager_id } });
  return Managers.findByPk(manager_id);
}

export async function activate(manager_id) {
  const { Managers } = getModels();
  await Managers.update({ is_active: true }, { where: { manager_id } });
  return Managers.findByPk(manager_id);
}

export async function deactivate(manager_id) {
  const { Managers } = getModels();
  await Managers.update({ is_active: false }, { where: { manager_id } });
  return Managers.findByPk(manager_id);
}

export async function remove(manager_id) {
  const { Managers } = getModels();
  return Managers.destroy({ where: { manager_id } });
}

export default { create, list, getById, getByUser, update, activate, deactivate, remove };
