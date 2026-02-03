import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { ImpactType } from '@prisma/client';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const createImpactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.nativeEnum(ImpactType, { message: 'Invalid impact type' }),
  unitValue: z.number().positive('Unit value must be positive'),
});

const updateImpactSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.nativeEnum(ImpactType).optional(),
  unitValue: z.number().positive().optional(),
});

export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  try {
    registerSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(StatusCodes.BAD_REQUEST).json({ 
        message: 'Validation failed', 
        errors: error.issues 
      });
    } else {
      next(error);
    }
  }
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  try {
    loginSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(StatusCodes.BAD_REQUEST).json({ 
        message: 'Validation failed', 
        errors: error.issues 
      });
    } else {
      next(error);
    }
  }
};

export const validateImpactCreate = (req: Request, res: Response, next: NextFunction) => {
  try {
    createImpactSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(StatusCodes.BAD_REQUEST).json({ 
        message: 'Validation failed', 
        errors: error.issues 
      });
    } else {
      next(error);
    }
  }
};

export const validateImpactUpdate = (req: Request, res: Response, next: NextFunction) => {
  try {
    updateImpactSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(StatusCodes.BAD_REQUEST).json({ 
        message: 'Validation failed', 
        errors: error.issues 
      });
    } else {
      next(error);
    }
  }
};
