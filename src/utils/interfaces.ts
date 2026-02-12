import { Router } from 'express';
import { ImpactType } from '@prisma/client';

export interface Routes {
  path?: string;
  router: Router;
}

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

export interface CreateProjectDTO {
  name: string;
  description?: string;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
}

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
