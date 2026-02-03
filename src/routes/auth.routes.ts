import { Router } from 'express';
import { Routes } from '../utils/interfaces';
import AuthController from '../controllers/auth.controller';

// Auth Routes
class AuthRoutes implements Routes {
  path = '/api/auth';
  router: Router = Router();
  private authController: AuthController;

  constructor() {
    this.authController = new AuthController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // TODO: Define auth routes
    // POST /api/auth/register
    // POST /api/auth/login
  }
}

export default AuthRoutes;
