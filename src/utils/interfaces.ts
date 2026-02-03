import { Router } from 'express';
import { ImpactType } from '@prisma/client';

// Route interface (from reference repo)
export interface Routes {
  path?: string;
  router: Router;
}

// Impact Event Data Transfer Objects
export interface CreateImpactDTO {
  name: string;
  description?: string;
  type: ImpactType;
  unitValue: number;
}

export interface UpdateImpactDTO {
  name?: string;
  description?: string;
  type?: ImpactType;
  unitValue?: number;
}

// Auth DTOs
export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}
