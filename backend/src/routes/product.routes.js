import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';

const router = Router();

// Públicas: la tienda se ve sin cuenta. Crear y editar (solo admin) irá en el panel.
router.get('/', productController.list);
router.get('/:id', productController.getOne);

export default router;
