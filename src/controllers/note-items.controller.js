import * as itemsService from '../services/note-items.service.js';

export async function listForNote(req, res) {
  try {
    const { note_id } = req.params;
    const data = await itemsService.listForNote(note_id);
    res.json(data);
  } catch (err) {
    console.error('noteItems.listForNote error', err);
    res.status(500).json({ message: 'Internal error' });
  }
}

export async function createForNote(req, res) {
  try {
    const { note_id } = req.params;
    const created = await itemsService.createForNote(note_id, req.body);
    res.status(201).json(created);
  } catch (err) {
    console.error('noteItems.createForNote error', err);
    res.status(500).json({ message: 'Internal error' });
  }
}

export async function patch(req, res) {
  try {
    const { item_id } = req.params;
    const updated = await itemsService.patch(item_id, req.body);
    if (!updated) return res.status(404).json({ message: 'Item not found' });
    res.json(updated);
  } catch (err) {
    console.error('noteItems.patch error', err);
    res.status(500).json({ message: 'Internal error' });
  }
}

export async function remove(req, res) {
  try {
    const { item_id } = req.params;
    const ok = await itemsService.remove(item_id);
    if (!ok) return res.status(404).json({ message: 'Item not found' });
    res.status(204).send();
  } catch (err) {
    console.error('noteItems.remove error', err);
    res.status(500).json({ message: 'Internal error' });
  }
}

export default { listForNote, createForNote, patch, remove };
