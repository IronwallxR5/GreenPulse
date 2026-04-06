import api from './api';

export interface Project {
  id: number;
  name: string;
  description: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    impactLogs: number;
  }
}

export interface ProjectSummary {
  totalCO2: number;
  totalLogs: number;
  byType: {
    type: string;
    totalCO2: number;
    count: number;
  }[];
}

export const projectService = {
  async getAll(): Promise<Project[]> {
    const res = await api.get('/projects');
    return res.data;
  },

  async getOne(id: number): Promise<Project> {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },

  async getSummary(id: number): Promise<ProjectSummary> {
    const res = await api.get(`/projects/${id}/summary`);
    return res.data;
  },

  async create(data: { name: string; description?: string }): Promise<Project> {
    const res = await api.post('/projects', data);
    return res.data;
  },

  async update(id: number, data: { name?: string; description?: string }): Promise<Project> {
    const res = await api.put(`/projects/${id}`, data);
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/projects/${id}`);
  },
};
