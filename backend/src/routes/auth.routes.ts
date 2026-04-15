import { Router } from 'express';
import passport from 'passport';
import { Routes } from '../utils/interfaces';
import AuthController from '../controllers/auth.controller';
import { validateRegister, validateLogin } from '../middleware/validation.middleware';
import { authenticateToken } from '../middleware/auth.middleware';

class AuthRoutes implements Routes {
  path = '/api/auth';
  router: Router = Router();
  private authController: AuthController;

  constructor() {
    this.authController = new AuthController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // --- Email / Password ---
    this.router.post(`${this.path}/register`, validateRegister, this.authController.register);
    this.router.post(`${this.path}/login`, validateLogin, this.authController.login);
    this.router.get(`${this.path}/me`, authenticateToken, this.authController.me);

    // --- Google OAuth ---
    // Step 1: Redirect the user to Google's consent screen
    this.router.get(
      `${this.path}/google`,
      passport.authenticate('google', { scope: ['profile', 'email'], session: false })
    );

    // Step 2: Google redirects back here after consent
    this.router.get(
      `${this.path}/google/callback`,
      passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }),
      this.authController.googleCallback
    );
  }
}

export default AuthRoutes;
