import express, { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { adminOnly, authRequired } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from '../utils/images.js';
import {
  orderStatusSchema,
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  patternActiveSchema,
} from '../validators/admin.validators.js';

const router = Router();

// Panel de admin: todo exige sesión (401) y rol admin (403).
router.use(authRequired, adminOnly);

// Pedidos
router.get('/orders', adminController.listOrders);
router.get('/orders/:id', adminController.getOrder);
router.patch('/orders/:id', validate(orderStatusSchema), adminController.changeOrderStatus);

// Productos y sus variantes (no se borran: se retiran con is_active = false)
router.get('/products', adminController.listProducts);
router.post('/products', validate(createProductSchema), adminController.createProduct);
router.get('/products/:id', adminController.getProduct);
router.patch('/products/:id', validate(updateProductSchema), adminController.updateProduct);
router.post('/products/:id/variants', validate(createVariantSchema), adminController.createVariant);
router.patch('/variants/:variantId', validate(updateVariantSchema), adminController.updateVariant);

// Fotos: binario con Content-Type de imagen (máx. 3 MB) y el texto alternativo en X-Image-Alt.
const rawImage = express.raw({ type: IMAGE_TYPES, limit: MAX_IMAGE_BYTES });
router.put('/products/:id/image', rawImage, adminController.setProductImage);
router.delete('/products/:id/image', adminController.removeProductImage);
router.put('/variants/:variantId/image', rawImage, adminController.setVariantImage);
router.delete('/variants/:variantId/image', adminController.removeVariantImage);

// Patrones de Buclees: lista (también los retirados) y retirar o volver a publicar.
router.get('/patterns', adminController.listPatterns);
router.patch('/patterns/:id', validate(patternActiveSchema), adminController.setPatternActive);

export default router;
