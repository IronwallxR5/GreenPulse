import { Router } from 'express';
import { Routes } from '../utils/interfaces';
import AuthController from '../controllers/auth.controller';
import { validateRegister, validateLogin } from '../middleware/validation.middleware';

class AuthRoutes implements Routes {
  path = '/api/auth';
  router: Router = Router();
  private authController: AuthController;

  constructor() {
    this.authController = new AuthController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/register`, validateRegister, this.authController.register);
    this.router.post(`${this.path}/login`, validateLogin, this.authController.login);
  }
}

export default AuthRoutes;
