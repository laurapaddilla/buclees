import * as orderService from '../services/order.service.js';
import { parseId } from '../utils/parseId.js';

export async function list(req, res) {
  const orders = await orderService.listOrders(req.user.id);
  res.json({ orders });
}

export async function getOne(req, res) {
  const order = await orderService.getOrder(req.user.id, parseId(req.params.id, 'Pedido no encontrado'));
  res.json({ order });
}

export async function create(req, res) {
  const order = await orderService.createOrder(req.user.id, req.body);
  res.status(201).json({ order });
}

export async function lastAddress(req, res) {
  const address = await orderService.lastAddress(req.user.id);
  res.json({ address });
}
