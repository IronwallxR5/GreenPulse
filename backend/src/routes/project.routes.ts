import { Router } from 'express';
import { Routes } from '../utils/interfaces';
import ProjectController from '../controllers/project.controller';
import { authenticateToken, authenticateTokenAllowQuery } from '../middleware/auth.middleware';
import { validateProjectCreate, validateProjectUpdate } from '../middleware/validation.middleware';

class ProjectRoutes implements Routes {
  path = '/api/projects';
  router: Router = Router();
  private projectController: ProjectController;

  constructor() {
    this.projectController = new ProjectController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}`,
      authenticateToken,
      validateProjectCreate,
      this.projectController.createProject
    );

    this.router.get(`${this.path}`, authenticateToken, this.projectController.getAllProjects);

    this.router.get(`${this.path}/:id`, authenticateToken, this.projectController.getProject);

    this.router.get(`${this.path}/:id/summary`, authenticateToken, this.projectController.getProjectSummary);

    this.router.get(`${this.path}/:id/report`, authenticateToken, this.projectController.getProjectReport);

    // ── Carbon threshold budget & alerts ─────────────────────────────────────
    this.router.put(`${this.path}/:id/budget`, authenticateToken, this.projectController.setBudget);

    this.router.get(`${this.path}/:id/alerts`, authenticateToken, this.projectController.getAlerts);

    this.router.get(
      `${this.path}/:id/alerts/stream`,
      authenticateTokenAllowQuery,
      this.projectController.streamAlerts
    );

    this.router.patch(`${this.path}/:id/alerts/read`, authenticateToken, this.projectController.markAlertsRead);

    this.router.put(
      `${this.path}/:id`,
      authenticateToken,
      validateProjectUpdate,
      this.projectController.updateProject
    );

    this.router.delete(`${this.path}/:id`, authenticateToken, this.projectController.deleteProject);
  }
}

export default ProjectRoutes;
