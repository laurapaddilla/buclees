import * as authService from '../services/auth.service.js';

// Los controladores solo traducen HTTP <-> servicio. La lógica está en services/.
// Express 5 pasa automáticamente al manejador de errores cualquier error de una función async.

export async function register(req, res) {
  const result = await authService.register(req.body);
  res.status(201).json(result);
}

export async function login(req, res) {
  const result = await authService.login(req.body);
  res.json(result);
}

export async function me(req, res) {
  const user = await authService.getUserById(req.user.id);
  res.json({ user });
}

export async function updateMe(req, res) {
  const user = await authService.updateMe(req.user.id, req.body);
  res.json({ user });
}

export async function changePassword(req, res) {
  await authService.changePassword(req.user.id, req.body);
  res.status(204).end();
}

export async function deleteMe(req, res) {
  await authService.deleteMe(req.user.id, req.body);
  res.status(204).end();
}
