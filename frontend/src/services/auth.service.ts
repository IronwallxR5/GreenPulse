import api from './api';

export interface User {
  id: number;
  email: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
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

  async me(): Promise<User> {
    const res = await api.get('/auth/me');
    return res.data;
  },

  loginWithGoogle() {
    const backendUrl =
      import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8080';
    window.location.href = `${backendUrl}/api/auth/google`;
  },
};
