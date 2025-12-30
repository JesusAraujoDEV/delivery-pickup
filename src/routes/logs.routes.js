import { Router } from 'express';
import controller from '../controllers/logs.controller.js';
import { authorize } from '../middlewares/auth.middleware.js';
import {
  validateParams,
  validateQuery,
  logIdParamSchema,
  noteIdParamSchema,
  logsSearchQuerySchema,
} from '../schemas/logs.schemas.js';

const router = Router();

// Historial general
router.get('/logs', validateQuery(logsSearchQuerySchema), controller.list);

// Search (mismos filtros, pero queda explícito)
router.get('/logs/search', validateQuery(logsSearchQuerySchema), controller.search);

// Historia de una orden
router.get('/logs/by-note/:note_id', validateParams(noteIdParamSchema), validateQuery(logsSearchQuerySchema), controller.listByNote);

// Detalle
router.get('/logs/:log_id', validateParams(logIdParamSchema), controller.get);

export default router;
