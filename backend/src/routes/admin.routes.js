import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { adminOnly, authRequired } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { orderStatusSchema } from '../validators/admin.validators.js';

const router = Router();

// Panel de admin: todo exige sesión (401) y rol admin (403).
router.use(authRequired, adminOnly);

router.get('/orders', adminController.listOrders);
router.get('/orders/:id', adminController.getOrder);
router.patch('/orders/:id', validate(orderStatusSchema), adminController.changeOrderStatus);

export default router;
