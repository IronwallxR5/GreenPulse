import { Request, Response } from 'express';
import AuthService from '../services/auth.service';

// Auth Controller: Handle authentication requests
class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // TODO: Implement auth endpoints
  // - register = async (req, res)
  // - login = async (req, res)
}

export default AuthController;
