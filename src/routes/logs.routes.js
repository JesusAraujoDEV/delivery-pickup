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
router.get('/logs', authorize('Logs_dp', 'Read'), validateQuery(logsSearchQuerySchema), controller.list);

// Search (mismos filtros, pero queda explícito)
router.get('/logs/search', authorize('Logs_dp', 'Read'), validateQuery(logsSearchQuerySchema), controller.search);

// Historia de una orden
router.get('/logs/by-note/:note_id', authorize('Logs_dp', 'Read'), validateParams(noteIdParamSchema), validateQuery(logsSearchQuerySchema), controller.listByNote);

// Detalle
router.get('/logs/:log_id', authorize('Logs_dp', 'Read'), validateParams(logIdParamSchema), controller.get);

export default router;
