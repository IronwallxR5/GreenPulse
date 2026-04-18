import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';

interface JwtPayload {
  userId: number;
}

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

const verifyTokenAndAttachUser = (
  token: string,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server configuration error' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.userId = decoded.userId;
    next();
  } catch (_error) {
    res.status(StatusCodes.FORBIDDEN).json({ message: 'Invalid or expired token' });
  }
};

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Access token required' });
    return;
  }

  verifyTokenAndAttachUser(token, req, res, next);
};

// Supports EventSource clients that cannot set Authorization headers.
export const authenticateTokenAllowQuery = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.split(' ')[1];
  const queryToken = typeof req.query.token === 'string' ? req.query.token : undefined;
  const token = headerToken || queryToken;

  if (!token) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Access token required' });
    return;
  }

  verifyTokenAndAttachUser(token, req, res, next);
};
