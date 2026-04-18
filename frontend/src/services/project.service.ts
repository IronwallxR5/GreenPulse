import api from './api';
import { io } from 'socket.io-client';

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

export interface ProjectAlertStreamEvent {
  projectId: number;
  totalCO2: number;
  budget: number;
  message: string;
  timestamp: string;
}

interface ProjectAlertSocketAck {
  ok: boolean;
  message?: string;
}

const getBackendBaseUrl = () => {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  return apiBase.replace(/\/api\/?$/, '');
};

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

  streamAlerts(
    id: number,
    onAlert: (event: ProjectAlertStreamEvent) => void,
    onConnected?: () => void,
    onError?: (event: Event) => void,
  ): () => void {
    const token = localStorage.getItem('token');
    if (!token) {
      return () => undefined;
    }

    const baseUrl = getBackendBaseUrl();
    const streamUrl = `${baseUrl}/api/projects/${id}/alerts/stream?token=${encodeURIComponent(token)}`;
    const source = new EventSource(streamUrl);

    source.addEventListener('connected', () => {
      onConnected?.();
    });

    source.addEventListener('alert', (event) => {
      try {
        const parsed = JSON.parse((event as MessageEvent<string>).data) as ProjectAlertStreamEvent;
        onAlert(parsed);
      } catch (error) {
        console.error('[projectService.streamAlerts] Failed to parse stream event', error);
      }
    });

    source.onerror = (event) => {
      onError?.(event);
    };

    return () => {
      source.close();
    };
  },

  streamAlertsSocket(
    id: number,
    onAlert: (event: ProjectAlertStreamEvent) => void,
    onConnected?: () => void,
    onError?: (error: unknown) => void,
  ): () => void {
    const token = localStorage.getItem('token');
    if (!token) {
      return () => undefined;
    }

    const baseUrl = getBackendBaseUrl();
    const socket = io(baseUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('subscribe-project', { projectId: id }, (ack: ProjectAlertSocketAck) => {
        if (ack?.ok) {
          onConnected?.();
          return;
        }

        onError?.(ack?.message || 'Failed to subscribe project alerts');
      });
    });

    socket.on('connected', () => {
      onConnected?.();
    });

    socket.on('threshold-alert', (event: ProjectAlertStreamEvent) => {
      onAlert(event);
    });

    socket.on('connect_error', (error) => {
      onError?.(error);
    });

    socket.on('error', (error) => {
      onError?.(error);
    });

    return () => {
      socket.emit('unsubscribe-project', { projectId: id });
      socket.disconnect();
    };
  },
};
