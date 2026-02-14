import { Request, Response } from 'express';
import ProjectService from '../services/project.service';
import { StatusCodes } from 'http-status-codes';

class ProjectController {
  private projectService: ProjectService;

  constructor() {
    this.projectService = new ProjectService();
  }

  createProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const project = await this.projectService.createProject(req.body, userId);
      res.status(StatusCodes.CREATED).json(project);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create project';
      res.status(StatusCodes.BAD_REQUEST).json({ message });
    }
  };

  getProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const id = parseInt(String(req.params.id));
      const project = await this.projectService.getProjectById(id, userId);
      res.status(StatusCodes.OK).json(project);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get project';
      const status = message === 'Project not found' ? StatusCodes.NOT_FOUND : StatusCodes.FORBIDDEN;
      res.status(status).json({ message });
    }
  };

  getAllProjects = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const projects = await this.projectService.getAllProjects(userId);
      res.status(StatusCodes.OK).json(projects);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get projects';
      res.status(StatusCodes.BAD_REQUEST).json({ message });
    }
  };

  updateProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const id = parseInt(String(req.params.id));
      const project = await this.projectService.updateProject(id, req.body, userId);
      res.status(StatusCodes.OK).json(project);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update project';
      const status = message === 'Project not found' ? StatusCodes.NOT_FOUND : StatusCodes.FORBIDDEN;
      res.status(status).json({ message });
    }
  };

  deleteProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const id = parseInt(String(req.params.id));
      await this.projectService.deleteProject(id, userId);
      res.status(StatusCodes.OK).json({ message: 'Project deleted successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete project';
      const status = message === 'Project not found' ? StatusCodes.NOT_FOUND : StatusCodes.FORBIDDEN;
      res.status(status).json({ message });
    }
  };

  getProjectSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const id = parseInt(String(req.params.id));
      const summary = await this.projectService.getProjectSummary(id, userId);
      res.status(StatusCodes.OK).json(summary);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get project summary';
      const status = message === 'Project not found' ? StatusCodes.NOT_FOUND : StatusCodes.FORBIDDEN;
      res.status(status).json({ message });
    }
  };
}

export default ProjectController;
