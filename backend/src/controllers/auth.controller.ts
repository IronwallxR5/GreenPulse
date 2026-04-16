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
   *
   * We intentionally send an HTML page with a JS redirect instead of
   * res.redirect() (HTTP 302). Chrome blocks 302 redirects that arrive
   * while the browser is on a chrome-error:// page (which can happen
   * during the OAuth handshake when localhost:8080 responds slowly).
   * window.location.href is a top-level navigation and is always allowed.
   */
  googleCallback = (req: Request, res: Response): void => {
    try {
      const user = req.user as { id: number };
      const token = this.authService.generateToken(user.id);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const destination = `${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}`;

      res.setHeader('Content-Type', 'text/html');
      res.send(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Signing in to GreenPulse…</title>
  </head>
  <body>
    <script>window.location.href = ${JSON.stringify(destination)};</script>
    <p>Redirecting… <a href="${destination}">Click here</a> if nothing happens.</p>
  </body>
</html>`);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.setHeader('Content-Type', 'text/html');
      res.send(`<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /></head>
  <body>
    <script>window.location.href = ${JSON.stringify(`${frontendUrl}/login?error=oauth_failed`)};</script>
  </body>
</html>`);
    }
  };
}

export default AuthController;
