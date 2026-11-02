import * as patternService from '../services/pattern.service.js';
import { parseId } from '../utils/parseId.js';

const patternId = (req) => parseId(req.params.id, 'Patrón no encontrado');

// El texto alternativo llega en la cabecera X-Image-Alt, codificado con encodeURIComponent (admite tildes).
function imageAlt(req) {
  try {
    return decodeURIComponent(req.get('X-Image-Alt') ?? '');
  } catch {
    return '';
  }
}

export async function list(req, res) {
  const patterns = await patternService.listPatterns({ difficulty: req.query.difficulty });
  res.json({ patterns });
}

// Con sesión (optionalAuth) también se ven los patrones privados propios.
export async function getOne(req, res) {
  const pattern = await patternService.getPattern(patternId(req), req.user?.id ?? null);
  res.json({ pattern });
}

export async function listMine(req, res) {
  res.json({ patterns: await patternService.listMine(req.user.id) });
}

export async function create(req, res) {
  res.status(201).json({ pattern: await patternService.savePattern(req.user, null, req.body) });
}

export async function update(req, res) {
  res.json({ pattern: await patternService.savePattern(req.user, patternId(req), req.body) });
}

export async function remove(req, res) {
  await patternService.deletePattern(req.user.id, patternId(req));
  res.status(204).end();
}

export async function setImage(req, res) {
  res.json({ pattern: await patternService.setPatternImage(req.user.id, patternId(req), req.body, imageAlt(req)) });
}

export async function removeImage(req, res) {
  res.json({ pattern: await patternService.removePatternImage(req.user.id, patternId(req)) });
}
