import { Router } from 'express';
import Joi from 'joi';
import * as notesController from '../controllers/notes.controller.js';
import * as itemsController from '../controllers/note-items.controller.js';
import { authorize } from '../middlewares/auth.middleware.js';
import {
  validateBody,
  validateParams,
  noteIdParamSchema,
  readableIdParamSchema,
  itemIdParamSchema,
  patchNoteSchema,
  createNoteItemSchema,
  patchNoteItemSchema,
} from '../schemas/notes.schemas.js';

const router = Router();

// Notes
router.get('/notes', authorize('Notes_dp', 'Read'), notesController.list);

router.get('/notes/by-readable/:readable_id', authorize('Notes_dp', 'Read'), validateParams(readableIdParamSchema), notesController.getByReadable);

router.get('/notes/:note_id', authorize('Notes_dp', 'Read'), validateParams(noteIdParamSchema), notesController.get);
router.patch('/notes/:note_id', authorize('Notes_dp', 'Update'), validateParams(noteIdParamSchema), validateBody(patchNoteSchema), notesController.patch);

// Note Items
router.get('/notes/:note_id/items', authorize('NotesItems_dp', 'Read'), validateParams(noteIdParamSchema), itemsController.listForNote);
router.post(
  '/notes/:note_id/items',
  authorize('NotesItems_dp', 'Create'),
  validateParams(noteIdParamSchema),
  validateBody(createNoteItemSchema),
  itemsController.createForNote,
);

router.patch('/note-items/:item_id', authorize('NotesItems_dp', 'Update'), validateParams(itemIdParamSchema), validateBody(patchNoteItemSchema), itemsController.patch);
router.delete('/note-items/:item_id', authorize('NotesItems_dp', 'Delete'), validateParams(itemIdParamSchema), itemsController.remove);

// Extra: no se pidió, pero deja claro que esta ruta no existe
router.use('/note-items', (req, res, next) => next());

export default router;
