import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authRequired } from '../middleware/auth.js';
import {
  registerSchema,
  loginSchema,
  updateMeSchema,
  changePasswordSchema,
  deleteMeSchema,
} from '../validators/auth.validators.js';

const router = Router();

// Cada ruta encadena middlewares: primero se valida, luego actúa el controlador.
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authRequired, authController.me);

// Perfil: mis datos, mi contraseña (pidiendo la actual) y borrar mi cuenta (confirmando con la contraseña).
router.patch('/me', authRequired, validate(updateMeSchema), authController.updateMe);
router.put('/me/password', authRequired, validate(changePasswordSchema), authController.changePassword);
router.delete('/me', authRequired, validate(deleteMeSchema), authController.deleteMe);

export default router;
