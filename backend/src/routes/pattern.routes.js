import { Router } from 'express';
import * as patternController from '../controllers/pattern.controller.js';

const router = Router();

// Públicas: los patrones son gratuitos y se pueden consultar sin cuenta.
// Crear y editar (solo admin) llegará en el paso 5.
router.get('/', patternController.list);
router.get('/:id', patternController.getOne);

export default router;
