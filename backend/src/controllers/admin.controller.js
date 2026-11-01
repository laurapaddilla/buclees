import * as orderService from '../services/order.service.js';
import { parseId } from '../utils/parseId.js';
import { ORDER_STATUSES } from '../validators/admin.validators.js';
import { HttpError } from '../utils/HttpError.js';

export async function listOrders(req, res) {
  const { status } = req.query;
  if (status && !ORDER_STATUSES.includes(status)) throw new HttpError(400, 'El estado no es válido');
  const orders = await orderService.adminListOrders({ status });
  res.json({ orders });
}

export async function getOrder(req, res) {
  const order = await orderService.adminGetOrder(parseId(req.params.id, 'Pedido no encontrado'));
  res.json({ order });
}

export async function changeOrderStatus(req, res) {
  const order = await orderService.changeOrderStatus(parseId(req.params.id, 'Pedido no encontrado'), req.body.status);
  res.json({ order });
}
