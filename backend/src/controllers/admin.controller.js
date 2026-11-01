import * as orderService from '../services/order.service.js';
import * as productService from '../services/admin-product.service.js';
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

// ---------- Productos ----------

const productId = (req) => parseId(req.params.id, 'Producto no encontrado');
const variantId = (req) => parseId(req.params.variantId, 'Color o tamaño no encontrado');

// El texto alternativo llega en la cabecera X-Image-Alt, codificado con encodeURIComponent (admite tildes).
function imageAlt(req) {
  try {
    return decodeURIComponent(req.get('X-Image-Alt') ?? '');
  } catch {
    return '';
  }
}

export async function listProducts(req, res) {
  res.json({ products: await productService.listProducts() });
}

export async function getProduct(req, res) {
  res.json({ product: await productService.getProduct(productId(req)) });
}

export async function createProduct(req, res) {
  res.status(201).json({ product: await productService.createProduct(req.body) });
}

export async function updateProduct(req, res) {
  res.json({ product: await productService.updateProduct(productId(req), req.body) });
}

export async function createVariant(req, res) {
  res.status(201).json({ product: await productService.createVariant(productId(req), req.body) });
}

export async function updateVariant(req, res) {
  res.json({ product: await productService.updateVariant(variantId(req), req.body) });
}

export async function setProductImage(req, res) {
  res.json({ product: await productService.setProductImage(productId(req), req.body, imageAlt(req)) });
}

export async function removeProductImage(req, res) {
  res.json({ product: await productService.removeProductImage(productId(req)) });
}

export async function setVariantImage(req, res) {
  res.json({ product: await productService.setVariantImage(variantId(req), req.body, imageAlt(req)) });
}

export async function removeVariantImage(req, res) {
  res.json({ product: await productService.removeVariantImage(variantId(req)) });
}
