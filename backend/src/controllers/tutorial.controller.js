import * as tutorialService from '../services/tutorial.service.js';

export async function list(req, res) {
  const tutorials = await tutorialService.listTutorials();
  res.json({ tutorials });
}

export async function getOne(req, res) {
  const tutorial = await tutorialService.getTutorial(req.params.slug);
  res.json({ tutorial });
}
