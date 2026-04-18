import api from './api';
import { io } from 'socket.io-client';

export interface Project {
  id: number;
  name: string;
  description: string | null;
  userId: number;
  organizationId?: number | null;
  organization?: {
    id: number;
    name: string;
  } | null;
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

export interface ProjectAuditLog {
  id: number;
  userId: number;
  projectId: number | null;
  action: string;
  entityType: string;
  entityId: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ProjectAuditLogList {
  data: ProjectAuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type ReportFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type ReportFormat = 'PDF' | 'CSV';

export interface ProjectReportSchedule {
  id: number;
  projectId: number;
  userId: number;
  frequency: ReportFrequency;
  format: ReportFormat;
  isActive: boolean;
  nextRunAt: string;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceReport {
  id: number;
  projectId: number;
  userId: number;
  scheduleId: number | null;
  format: ReportFormat;
  totalCO2: number;
  totalLogs: number;
  byType: Array<{ type: string; totalCO2: number; count: number }>;
  generatedAt: string;
}

export interface ComplianceReportList {
  data: ComplianceReport[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type OrganizationRole = 'OWNER' | 'MEMBER';

export interface Organization {
  id: number;
  name: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  memberships?: Array<{ role: OrganizationRole }>;
  _count?: {
    memberships: number;
    projects: number;
  };
}

export interface OrganizationMember {
  id: number;
  organizationId: number;
  userId: number;
  role: OrganizationRole;
  createdAt: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
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

  async create(data: { name: string; description?: string; organizationId?: number }): Promise<Project> {
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

  async getAuditLogs(id: number, params?: { page?: number; limit?: number; action?: string }): Promise<ProjectAuditLogList> {
    const res = await api.get(`/projects/${id}/audit-logs`, {
      params,
    });
    return res.data;
  },

  async getReportSchedule(id: number): Promise<ProjectReportSchedule | null> {
    const res = await api.get(`/projects/${id}/report-schedule`);
    return res.data;
  },

  async upsertReportSchedule(
    id: number,
    payload: { frequency: ReportFrequency; format: ReportFormat; isActive?: boolean; startsAt?: string }
  ): Promise<ProjectReportSchedule> {
    const res = await api.put(`/projects/${id}/report-schedule`, payload);
    return res.data;
  },

  async deleteReportSchedule(id: number): Promise<{ message: string }> {
    const res = await api.delete(`/projects/${id}/report-schedule`);
    return res.data;
  },

  async getComplianceReports(id: number, params?: { page?: number; limit?: number }): Promise<ComplianceReportList> {
    const res = await api.get(`/projects/${id}/compliance-reports`, { params });
    return res.data;
  },

  async runComplianceReportNow(id: number, payload?: { format?: ReportFormat }): Promise<ComplianceReport> {
    const res = await api.post(`/projects/${id}/compliance-reports/run-now`, payload || {});
    return res.data;
  },

  async getOrganizations(): Promise<Organization[]> {
    const res = await api.get('/organizations');
    return res.data;
  },

  async createOrganization(data: { name: string }): Promise<Organization> {
    const res = await api.post('/organizations', data);
    return res.data;
  },

  async getOrganizationMembers(id: number): Promise<OrganizationMember[]> {
    const res = await api.get(`/organizations/${id}/members`);
    return res.data;
  },

  async addOrganizationMember(
    id: number,
    payload: { email: string; role?: OrganizationRole },
  ): Promise<OrganizationMember> {
    const res = await api.post(`/organizations/${id}/members`, payload);
    return res.data;
  },

  async removeOrganizationMember(id: number, memberUserId: number): Promise<{ message: string }> {
    const res = await api.delete(`/organizations/${id}/members/${memberUserId}`);
    return res.data;
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
