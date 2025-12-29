import { getModels } from '../models/index.js';

export async function list() {
  const { Notes } = getModels();
  return Notes.findAll();
}

export async function getById(note_id) {
  const { Notes } = getModels();
  return Notes.findByPk(note_id);
}

export async function getByReadableId(readable_id) {
  const { Notes } = getModels();
  return Notes.findOne({ where: { readable_id } });
}

export async function patch(note_id, payload) {
  const { Notes } = getModels();
  const record = await Notes.findByPk(note_id);
  if (!record) return null;
  await record.update(payload);
  return record;
}

export default { list, getById, getByReadableId, patch };
