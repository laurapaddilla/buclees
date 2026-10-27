import express, { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import { authRequired } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { MAX_PDF_BYTES } from '../utils/uploads.js';
import {
  createProjectSchema,
  updateProjectSchema,
  updateCounterSchema,
  stepDoneSchema,
  chooseSectionSchema,
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

// Parte del patrón que estás tejiendo: elegirla y terminarla (o pasar a su siguiente repetición)
router.post('/:id/section', validate(chooseSectionSchema), projectController.chooseSection);
router.post('/:id/section/complete', projectController.completeSection);

// Pasos del patrón de Buclees marcados como hechos
router.put('/:id/steps/:stepId', validate(stepDoneSchema), projectController.setStep);

// PDF propio: se sube como binario (máx. 10 MB); express.raw lo deja en req.body como Buffer.
router.put('/:id/pdf', express.raw({ type: 'application/pdf', limit: MAX_PDF_BYTES }), projectController.uploadPdf);
router.get('/:id/pdf', projectController.getPdf);
router.delete('/:id/pdf', projectController.deletePdf);

export default router;
