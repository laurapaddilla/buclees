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

// ---------- Pasos del patrón ----------

export async function setStep(req, res) {
  const stepId = parseId(req.params.stepId, 'Paso no encontrado');
  const step = await projectService.setStepDone(req.user.id, projectId(req), stepId, req.body.done);
  res.json({ step });
}

// ---------- PDF propio ----------

// El PDF llega como cuerpo binario (Content-Type: application/pdf) y su nombre original en X-File-Name.
export async function uploadPdf(req, res) {
  let name = 'patron.pdf';
  try {
    name = decodeURIComponent(req.get('X-File-Name') ?? name);
  } catch {
    // Nombre mal codificado: se usa el genérico.
  }
  const pdf = await projectService.uploadPdf(req.user.id, projectId(req), req.body, name);
  res.status(201).json({ pdf });
}

export async function getPdf(req, res) {
  const pdf = await projectService.getPdf(req.user.id, projectId(req));
  // Privado: no se guarda en cachés compartidas.
  res.set('Cache-Control', 'private, no-store');
  res.set('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(pdf.name)}`);
  res.type('application/pdf').sendFile(pdf.path);
}

export async function deletePdf(req, res) {
  await projectService.deletePdf(req.user.id, projectId(req));
  res.status(204).end();
}

// ---------- Partes del patrón ----------

export async function chooseSection(req, res) {
  const project = await projectService.chooseSection(req.user.id, projectId(req), req.body.section_id);
  res.json({ project });
}

export async function completeSection(req, res) {
  const project = await projectService.completeSection(req.user.id, projectId(req));
  res.json({ project });
}
