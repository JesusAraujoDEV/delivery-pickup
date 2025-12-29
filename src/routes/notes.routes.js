import { Router } from 'express';
import Joi from 'joi';
import * as notesController from '../controllers/notes.controller.js';
import * as itemsController from '../controllers/note-items.controller.js';
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
router.get('/notes', notesController.list);

router.get('/notes/by-readable/:readable_id', validateParams(readableIdParamSchema), notesController.getByReadable);

router.get('/notes/:note_id', validateParams(noteIdParamSchema), notesController.get);
router.patch('/notes/:note_id', validateParams(noteIdParamSchema), validateBody(patchNoteSchema), notesController.patch);

// Note Items
router.get('/notes/:note_id/items', validateParams(noteIdParamSchema), itemsController.listForNote);
router.post(
  '/notes/:note_id/items',
  validateParams(noteIdParamSchema),
  validateBody(createNoteItemSchema),
  itemsController.createForNote,
);

router.patch('/note-items/:item_id', validateParams(itemIdParamSchema), validateBody(patchNoteItemSchema), itemsController.patch);
router.delete('/note-items/:item_id', validateParams(itemIdParamSchema), itemsController.remove);

// Extra: no se pidió, pero deja claro que esta ruta no existe
router.use('/note-items', (req, res, next) => next());

export default router;
