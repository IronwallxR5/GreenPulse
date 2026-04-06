import api from './api';

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  async register(data: any): Promise<AuthResponse> {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async login(data: any): Promise<AuthResponse> {
    const res = await api.post('/auth/login', data);
    return res.data;
  },
};
