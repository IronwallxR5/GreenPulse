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
import { NotificationService } from './notifications/NotificationService';
import AuditService from './audit.service';

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
  private notificationService: NotificationService;
  private auditService: AuditService;

  constructor() {
    this.impactRepository = new ImpactRepository();
    this.projectRepository = new ProjectRepository();
    this.notificationService = NotificationService.getInstance();
    this.auditService = new AuditService();
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
    const project = await this.verifyProjectOwnership(projectId, userId);
    const carbonScore = this.calculateCO2(data.type, data.unitValue);

    const impact = await this.impactRepository.create({
      ...data,
      carbonScore,
      projectId,
    });

    await this.auditService.log({
      userId,
      projectId,
      action: 'IMPACT_CREATED',
      entityType: 'IMPACT_LOG',
      entityId: impact.id,
      metadata: {
        type: impact.type,
        unitValue: impact.unitValue,
        carbonScore: impact.carbonScore,
      },
    });

    // ── Observer Pattern: check threshold after impact is persisted ──────────────────
    if (project.carbonBudget != null) {
      const summary = await this.impactRepository.getSummaryByProjectId(projectId);
      if (summary.totalCO2 >= project.carbonBudget) {
        await this.notificationService.notifyThresholdExceeded(
          projectId,
          summary.totalCO2,
          project.carbonBudget,
        );

        await this.auditService.log({
          userId,
          projectId,
          action: 'PROJECT_BUDGET_EXCEEDED',
          entityType: 'PROJECT',
          entityId: projectId,
          metadata: {
            totalCO2: summary.totalCO2,
            budget: project.carbonBudget,
            triggeredByImpactId: impact.id,
          },
        });
      }
    }

    return impact;
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

    if (data.type !== undefined || data.unitValue !== undefined) {
      const type = data.type !== undefined ? data.type : existingImpact.type;
      const unitValue = data.unitValue !== undefined ? data.unitValue : existingImpact.unitValue;
      updateData.carbonScore = this.calculateCO2(type, unitValue);
    }

    const updated = await this.impactRepository.update(id, updateData);

    await this.auditService.log({
      userId,
      projectId: existingImpact.projectId,
      action: 'IMPACT_UPDATED',
      entityType: 'IMPACT_LOG',
      entityId: updated.id,
      metadata: {
        changedFields: Object.keys(data).filter((key) => (data as any)[key] !== undefined),
      },
    });

    return updated;
  }

  async deleteImpact(id: number, userId: number) {
    const impact = await this.impactRepository.findById(id);

    if (!impact) {
      throw new Error('Impact not found');
    }

    if (impact.project.userId !== userId) {
      throw new Error('Unauthorized access');
    }

    await this.auditService.log({
      userId,
      projectId: impact.projectId,
      action: 'IMPACT_DELETED',
      entityType: 'IMPACT_LOG',
      entityId: impact.id,
      metadata: {
        type: impact.type,
        carbonScore: impact.carbonScore,
      },
    });

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
