import * as productService from '../services/product.service.js';
import { parseId } from '../utils/parseId.js';

export async function list(req, res) {
  const products = await productService.listProducts({ category: req.query.category });
  res.json({ products });
}

export async function getOne(req, res) {
  const product = await productService.getProduct(parseId(req.params.id, 'Producto no encontrado'));
  res.json({ product });
}
