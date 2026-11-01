import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';
import { authRequired } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createOrderSchema } from '../validators/order.validators.js';

const router = Router();

// Pedidos: todo con sesión. Cada consulta filtra por la usuaria (req.user.id).
router.use(authRequired);

router.get('/', orderController.list);
router.post('/', validate(createOrderSchema), orderController.create);
// Antes de /:id para que «last-address» no se lea como un id.
router.get('/last-address', orderController.lastAddress);
router.get('/:id', orderController.getOne);

export default router;
