import { Router } from 'express';
import { Routes } from '../utils/interfaces';
import ImpactController from '../controllers/impact.controller';

// Routes: Define API endpoints
class ImpactRoutes implements Routes {
  path = '/api/impact';
  router: Router = Router();
  private impactController: ImpactController;

  constructor() {
    this.impactController = new ImpactController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // TODO: Define routes
    // POST   /api/impact          - Create new impact
    // GET    /api/impact          - Get all impacts (with filters)
    // GET    /api/impact/:id      - Get single impact
    // PUT    /api/impact/:id      - Update impact
    // DELETE /api/impact/:id      - Delete impact
    // GET    /api/impact/summary  - Get CO2 summary
  }
}

export default ImpactRoutes;
