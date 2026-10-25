import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authRequired } from '../middleware/auth.js';
import { registerSchema, loginSchema } from '../validators/auth.validators.js';

const router = Router();

// Cada ruta encadena middlewares: primero se valida, luego actúa el controlador.
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authRequired, authController.me);

export default router;
