import api from './api';

export type ImpactType = 'COMPUTE' | 'STORAGE' | 'NETWORK' | 'API_CALL';
export type SortBy = 'createdAt' | 'carbonScore' | 'name';
export type SortOrder = 'asc' | 'desc';

export interface ImpactLog {
  id: number;
  name: string;
  description: string | null;
  type: ImpactType;
  unitValue: number;
  carbonScore: number;
  projectId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ImpactFilters {
  type?: ImpactType;
  search?: string;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}

export interface ImpactPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ImpactListResponse {
  data: ImpactLog[];
  pagination: ImpactPagination;
}

export const impactService = {
  async getAll(projectId: number, filters?: ImpactFilters): Promise<ImpactListResponse> {
    const params: Record<string, string | number> = {};
    if (filters?.type)       params.type       = filters.type;
    if (filters?.search)     params.search     = filters.search;
    if (filters?.sortBy)     params.sortBy     = filters.sortBy;
    if (filters?.sortOrder)  params.sortOrder  = filters.sortOrder;
    if (filters?.page)       params.page       = filters.page;
    if (filters?.limit)      params.limit      = filters.limit;

    const res = await api.get(`/projects/${projectId}/impacts`, { params });
    return res.data;
  },

  async create(projectId: number, data: {
    name: string;
    description?: string;
    type: ImpactType;
    unitValue: number;
  }): Promise<ImpactLog> {
    const res = await api.post(`/projects/${projectId}/impacts`, data);
    return res.data;
  },

  async update(projectId: number, impactId: number, data: {
    name?: string;
    description?: string;
    type?: ImpactType;
    unitValue?: number;
  }): Promise<ImpactLog> {
    const res = await api.put(`/projects/${projectId}/impacts/${impactId}`, data);
    return res.data;
  },

  async delete(projectId: number, impactId: number): Promise<void> {
    await api.delete(`/projects/${projectId}/impacts/${impactId}`);
  },
};
