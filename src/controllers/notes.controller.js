import * as notesService from '../services/notes.service.js';

export async function list(req, res) {
  try {
    const data = await notesService.list();
    res.json(data);
  } catch (err) {
    console.error('notes.list error', err);
    res.status(500).json({ message: 'Internal error' });
  }
}

export async function get(req, res) {
  try {
    const { note_id } = req.params;
    const data = await notesService.getById(note_id);
    if (!data) return res.status(404).json({ message: 'Note not found' });
    res.json(data);
  } catch (err) {
    console.error('notes.get error', err);
    res.status(500).json({ message: 'Internal error' });
  }
}

export async function getByReadable(req, res) {
  try {
    const { readable_id } = req.params;
    const data = await notesService.getByReadableId(readable_id);
    if (!data) return res.status(404).json({ message: 'Note not found' });
    res.json(data);
  } catch (err) {
    console.error('notes.getByReadable error', err);
    res.status(500).json({ message: 'Internal error' });
  }
}

export async function patch(req, res) {
  try {
    const { note_id } = req.params;
    const updated = await notesService.patch(note_id, req.body);
    if (!updated) return res.status(404).json({ message: 'Note not found' });
    res.json(updated);
  } catch (err) {
    console.error('notes.patch error', err);
    res.status(500).json({ message: 'Internal error' });
  }
}

export default { list, get, getByReadable, patch };
