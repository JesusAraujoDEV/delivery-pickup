import { getModels } from '../models/index.js';
import crypto from 'crypto';

export async function create(data) {
  const { Zones } = getModels();
  const zoneData = {
    ...data,
    zone_id: data.zone_id || crypto.randomUUID(),
  };
  return Zones.create(zoneData);
}

export async function list() {
  const { Zones } = getModels();
  return Zones.findAll();
}

export async function getById(zone_id) {
  const { Zones } = getModels();
  return Zones.findByPk(zone_id);
}

export async function listActive() {
  const { Zones } = getModels();
  return Zones.findAll({ where: { is_active: true } });
}

export async function update(zone_id, data) {
  const { Zones } = getModels();
  const [count] = await Zones.update(data, { where: { zone_id } });
  if (!count) return null;
  return Zones.findByPk(zone_id);
}

export async function setActive(zone_id, active) {
  const { Zones } = getModels();
  const [count] = await Zones.update({ is_active: active }, { where: { zone_id } });
  if (!count) return null;
  return Zones.findByPk(zone_id);
}

export async function remove(zone_id) {
  const { Zones } = getModels();
  const deleted = await Zones.destroy({ where: { zone_id } });
  return deleted ? true : false;
}

export default { create, list, getById, listActive, update, setActive, remove };
