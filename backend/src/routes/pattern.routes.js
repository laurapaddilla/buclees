import express, { Router } from 'express';
import * as patternController from '../controllers/pattern.controller.js';
import { authRequired, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { patternSchema } from '../validators/pattern.validators.js';
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from '../utils/images.js';

const router = Router();

// Públicas: los patrones publicados son gratuitos y se pueden consultar sin cuenta.
router.get('/', patternController.list);
// «Mis patrones» va antes de /:id para que «mine» no se lea como un id.
router.get('/mine', authRequired, patternController.listMine);
// Con sesión, el detalle también enseña los patrones privados propios.
router.get('/:id', optionalAuth, patternController.getOne);

// Editor: cada usuaria crea y edita los suyos (solo la admin puede publicarlos).
router.post('/', authRequired, validate(patternSchema), patternController.create);
router.put('/:id', authRequired, validate(patternSchema), patternController.update);
router.delete('/:id', authRequired, patternController.remove);

// Foto opcional: binario con Content-Type de imagen (máx. 3 MB) y el texto alternativo en X-Image-Alt.
const rawImage = express.raw({ type: IMAGE_TYPES, limit: MAX_IMAGE_BYTES });
router.put('/:id/image', authRequired, rawImage, patternController.setImage);
router.delete('/:id/image', authRequired, patternController.removeImage);

export default router;
