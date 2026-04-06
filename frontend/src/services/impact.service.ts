import api from './api';

export interface ImpactLog {
  id: number;
  name: string;
  description: string | null;
  type: 'COMPUTE' | 'STORAGE' | 'NETWORK' | 'API_CALL';
  unitValue: number;
  carbonScore: number;
  projectId: number;
  createdAt: string;
  updatedAt: string;
}

export const impactService = {
  async getAll(projectId: number): Promise<{ data: ImpactLog[]; total: number }> {
    const res = await api.get(`/projects/${projectId}/impacts`);
    return res.data;
  },

  async create(projectId: number, data: any): Promise<ImpactLog> {
    const res = await api.post(`/projects/${projectId}/impacts`, data);
    return res.data;
  },

  async update(projectId: number, impactId: number, data: any): Promise<ImpactLog> {
    const res = await api.put(`/projects/${projectId}/impacts/${impactId}`, data);
    return res.data;
  },

  async delete(projectId: number, impactId: number): Promise<void> {
    await api.delete(`/projects/${projectId}/impacts/${impactId}`);
  },
};
