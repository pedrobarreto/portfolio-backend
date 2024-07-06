import { Request, Response } from 'express';
import { requestProjects } from '../services/GitHubApi';
const getProjects = async (req: Request, res: Response): Promise<void> => {
  const { language = 'en', page = 1 } = req.body;

  try {
    const projects = await requestProjects(language);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Error fetching projects' });
  }
};

export default getProjects;
