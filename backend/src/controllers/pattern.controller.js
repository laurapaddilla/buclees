import * as patternService from '../services/pattern.service.js';
import { parseId } from '../utils/parseId.js';

export async function list(req, res) {
  const patterns = await patternService.listPatterns({ difficulty: req.query.difficulty });
  res.json({ patterns });
}

export async function getOne(req, res) {
  const pattern = await patternService.getPattern(parseId(req.params.id, 'Patrón no encontrado'));
  res.json({ pattern });
}
