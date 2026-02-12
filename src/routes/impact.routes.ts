import { Router } from 'express';
import { Routes } from '../utils/interfaces';
import ImpactController from '../controllers/impact.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateImpactCreate, validateImpactUpdate } from '../middleware/validation.middleware';

class ImpactRoutes implements Routes {
  path = '/api/projects/:projectId/impacts';
  router: Router = Router();
  private impactController: ImpactController;

  constructor() {
    this.impactController = new ImpactController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}`,
      authenticateToken,
      validateImpactCreate,
      this.impactController.createImpact
    );

    this.router.get(`${this.path}/summary`, authenticateToken, this.impactController.getSummary);

    this.router.get(`${this.path}`, authenticateToken, this.impactController.getAllImpacts);

    this.router.get(`${this.path}/:id`, authenticateToken, this.impactController.getImpact);

    this.router.put(
      `${this.path}/:id`,
      authenticateToken,
      validateImpactUpdate,
      this.impactController.updateImpact
    );

    this.router.delete(`${this.path}/:id`, authenticateToken, this.impactController.deleteImpact);
  }
}

export default ImpactRoutes;
