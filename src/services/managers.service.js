import { getModels } from '../models/index.js';

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

export default { getByUser, update, activate, deactivate, remove };
