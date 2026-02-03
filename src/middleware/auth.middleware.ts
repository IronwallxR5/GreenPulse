import { Request, Response, NextFunction } from 'express';

// Auth Middleware: Protect routes with JWT verification
// TODO: Implement JWT verification middleware
// - verifyToken(req, res, next)
// - Add userId to req object after verification

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Implement token verification
};
