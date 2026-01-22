import { Router } from 'express';
import ctrl from '../controllers/auth.controller.js';
import { validateBody, loginSchema } from '../schemas/auth.schemas.js';

const router = Router();

router.post('/login', validateBody(loginSchema), ctrl.login);

export default router;
