import ImpactRepository from '../repositories/impact.repository';
import ProjectRepository from '../repositories/project.repository';
import { CreateImpactDTO, UpdateImpactDTO } from '../utils/interfaces';
import { ImpactType } from '@prisma/client';
import {
  ComputeEvent,
  StorageEvent,
  NetworkEvent,
  ApiCallEvent,
  ImpactEvent,
} from '../models/ImpactEvent';

interface GetAllFilters {
  type?: ImpactType;
  search?: string;
  sortBy?: 'createdAt' | 'carbonScore' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

class ImpactService {
  private impactRepository: ImpactRepository;
  private projectRepository: ProjectRepository;

  constructor() {
    this.impactRepository = new ImpactRepository();
    this.projectRepository = new ProjectRepository();
  }

  private async verifyProjectOwnership(projectId: number, userId: number) {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    if (project.userId !== userId) {
      throw new Error('Unauthorized access');
    }
    return project;
  }

  async createImpact(data: CreateImpactDTO, projectId: number, userId: number) {
    await this.verifyProjectOwnership(projectId, userId);
    const carbonScore = this.calculateCO2(data.type, data.unitValue);

    return await this.impactRepository.create({
      ...data,
      carbonScore,
      projectId,
    });
  }

  async getImpactById(id: number, userId: number) {
    const impact = await this.impactRepository.findById(id);

    if (!impact) {
      throw new Error('Impact not found');
    }

    if (impact.project.userId !== userId) {
      throw new Error('Unauthorized access');
    }

    return impact;
  }

  async getAllImpacts(projectId: number, userId: number, filters?: GetAllFilters) {
    await this.verifyProjectOwnership(projectId, userId);
    return await this.impactRepository.findByProjectId(projectId, filters);
  }

  async updateImpact(id: number, data: UpdateImpactDTO, userId: number) {
    const existingImpact = await this.impactRepository.findById(id);

    if (!existingImpact) {
      throw new Error('Impact not found');
    }

    if (existingImpact.project.userId !== userId) {
      throw new Error('Unauthorized access');
    }

    const updateData: any = { ...data };

    if (data.type || data.unitValue) {
      const type = data.type || existingImpact.type;
      const unitValue = data.unitValue || existingImpact.unitValue;
      updateData.carbonScore = this.calculateCO2(type, unitValue);
    }

    return await this.impactRepository.update(id, updateData);
  }

  async deleteImpact(id: number, userId: number) {
    const impact = await this.impactRepository.findById(id);

    if (!impact) {
      throw new Error('Impact not found');
    }

    if (impact.project.userId !== userId) {
      throw new Error('Unauthorized access');
    }

    return await this.impactRepository.delete(id);
  }

  async getSummary(projectId: number, userId: number) {
    await this.verifyProjectOwnership(projectId, userId);
    return await this.impactRepository.getSummaryByProjectId(projectId);
  }

  private calculateCO2(type: ImpactType, unitValue: number): number {
    let event: ImpactEvent;

    switch (type) {
      case ImpactType.COMPUTE:
        event = new ComputeEvent(0, '', unitValue, type, new Date());
        break;
      case ImpactType.STORAGE:
        event = new StorageEvent(0, '', unitValue, type, new Date());
        break;
      case ImpactType.NETWORK:
        event = new NetworkEvent(0, '', unitValue, type, new Date());
        break;
      case ImpactType.API_CALL:
        event = new ApiCallEvent(0, '', unitValue, type, new Date());
        break;
      default:
        throw new Error('Invalid impact type');
    }

    return event.calculateCO2();
  }
}

export default ImpactService;
