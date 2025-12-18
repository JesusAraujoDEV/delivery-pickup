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

export default { create, list, getById };
