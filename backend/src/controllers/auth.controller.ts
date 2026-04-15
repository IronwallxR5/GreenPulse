import { Request, Response } from 'express';
import AuthService from '../services/auth.service';
import UserRepository from '../repositories/user.repository';
import { StatusCodes } from 'http-status-codes';

class AuthController {
  private authService: AuthService;
  private userRepository: UserRepository;

  constructor() {
    this.authService = new AuthService();
    this.userRepository = new UserRepository();
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

  me = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const user = await this.userRepository.findById(userId);
      if (!user) {
        res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
        return;
      }
      // Return user without password
      const { password: _pw, googleId: _gid, ...safeUser } = user;
      res.status(StatusCodes.OK).json(safeUser);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch profile';
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message });
    }
  };

  /**
   * Called after Passport has verified the Google user.
   * req.user is set by passport.authenticate() before this runs.
   */
  googleCallback = (req: Request, res: Response): void => {
    try {
      const user = req.user as { id: number };
      const token = this.authService.generateToken(user.id);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  };
}

export default AuthController;
