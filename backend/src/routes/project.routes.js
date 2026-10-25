import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import { authRequired } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createProjectSchema,
  updateProjectSchema,
  updateCounterSchema,
} from '../validators/project.validators.js';

const router = Router();

// Todas las rutas de proyectos exigen sesión. El propietario se comprueba en cada consulta.
router.use(authRequired);

router.get('/', projectController.list);
router.post('/', validate(createProjectSchema), projectController.create);
router.get('/:id', projectController.getOne);
router.patch('/:id', validate(updateProjectSchema), projectController.update);
router.delete('/:id', projectController.remove);

// Contador y notas del proyecto
router.get('/:id/counter', projectController.getCounter);
router.post('/:id/counter/increment', projectController.increment);
router.post('/:id/counter/decrement', projectController.decrement);
router.post('/:id/counter/reset', projectController.reset);
router.patch('/:id/counter', validate(updateCounterSchema), projectController.setCounter);

export default router;
