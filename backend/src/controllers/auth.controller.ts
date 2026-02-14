import { Request, Response } from 'express';
import AuthService from '../services/auth.service';
import { StatusCodes } from 'http-status-codes';

class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);
      res.status(StatusCodes.CREATED).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      res.status(StatusCodes.BAD_REQUEST).json({ message });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.login(req.body);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      res.status(StatusCodes.UNAUTHORIZED).json({ message });
    }
  };
}

export default AuthController;
