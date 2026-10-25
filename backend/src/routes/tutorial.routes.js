import { Router } from 'express';
import * as tutorialController from '../controllers/tutorial.controller.js';

const router = Router();

// Públicas: los tutoriales se pueden ver sin cuenta.
router.get('/', tutorialController.list);
router.get('/:slug', tutorialController.getOne);

export default router;
