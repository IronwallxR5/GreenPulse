import api from './api';

export interface Project {
  id: number;
  name: string;
  description: string | null;
  userId: number;
  carbonBudget: number | null;
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

export interface ProjectAlert {
  id: number;
  projectId: number;
  message: string;
  totalCO2: number;
  budget: number;
  isRead: boolean;
  createdAt: string;
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

  async downloadReport(id: number, format: 'pdf' | 'csv'): Promise<void> {
    const res = await api.get(`/projects/${id}/report?format=${format}`, {
      responseType: 'blob',
    });

    const contentDisposition = res.headers['content-disposition'];
    let filename = `greenpulse-report-${id}.${format}`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
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

  async setBudget(id: number, carbonBudget: number | null): Promise<Project> {
    const res = await api.put(`/projects/${id}/budget`, { carbonBudget });
    return res.data;
  },

  async getAlerts(id: number): Promise<ProjectAlert[]> {
    const res = await api.get(`/projects/${id}/alerts`);
    return res.data;
  },

  async markAlertsRead(id: number): Promise<void> {
    await api.patch(`/projects/${id}/alerts/read`);
  },
};
