import * as projectService from '../services/project.service.js';
import { parseId } from '../utils/parseId.js';

const projectId = (req) => parseId(req.params.id, 'Proyecto no encontrado');

// ---------- Proyectos ----------

export async function list(req, res) {
  const projects = await projectService.listProjects(req.user.id);
  res.json({ projects });
}

export async function getOne(req, res) {
  const project = await projectService.getProject(req.user.id, projectId(req));
  res.json({ project });
}

export async function create(req, res) {
  const project = await projectService.createProject(req.user.id, req.body);
  res.status(201).json({ project });
}

export async function update(req, res) {
  const project = await projectService.updateProject(req.user.id, projectId(req), req.body);
  res.json({ project });
}

export async function remove(req, res) {
  await projectService.deleteProject(req.user.id, projectId(req));
  res.status(204).end();
}

// ---------- Contador ----------

export async function getCounter(req, res) {
  const counter = await projectService.getCounter(req.user.id, projectId(req));
  res.json({ counter });
}

export async function increment(req, res) {
  const counter = await projectService.incrementCounter(req.user.id, projectId(req));
  res.json({ counter });
}

export async function decrement(req, res) {
  const counter = await projectService.decrementCounter(req.user.id, projectId(req));
  res.json({ counter });
}

export async function reset(req, res) {
  const counter = await projectService.resetCounter(req.user.id, projectId(req));
  res.json({ counter });
}

export async function setCounter(req, res) {
  const counter = await projectService.setCounter(req.user.id, projectId(req), req.body);
  res.json({ counter });
}
