import ProjectRepository from '../repositories/project.repository';
import AlertRepository from '../repositories/alert.repository';
import { CreateProjectDTO, UpdateProjectDTO } from '../utils/interfaces';
import AuditService from './audit.service';

class ProjectService {
  private projectRepository: ProjectRepository;
  private alertRepository: AlertRepository;
  private auditService: AuditService;

  constructor() {
    this.projectRepository = new ProjectRepository();
    this.alertRepository = new AlertRepository();
    this.auditService = new AuditService();
  }

  async createProject(data: CreateProjectDTO, userId: number) {
    const project = await this.projectRepository.create({ ...data, userId });

    await this.auditService.log({
      userId,
      projectId: project.id,
      action: 'PROJECT_CREATED',
      entityType: 'PROJECT',
      entityId: project.id,
      metadata: {
        name: project.name,
      },
    });

    return project;
  }

  async getProjectById(id: number, userId: number) {
    const project = await this.projectRepository.findById(id);

    if (!project) {
      throw new Error('Project not found');
    }

    if (project.userId !== userId) {
      throw new Error('Unauthorized access');
    }

    return project;
  }

  async getAllProjects(userId: number) {
    return await this.projectRepository.findByUserId(userId);
  }

  async updateProject(id: number, data: UpdateProjectDTO, userId: number) {
    const project = await this.projectRepository.findById(id);

    if (!project) {
      throw new Error('Project not found');
    }

    if (project.userId !== userId) {
      throw new Error('Unauthorized access');
    }

    const updated = await this.projectRepository.update(id, data);

    await this.auditService.log({
      userId,
      projectId: updated.id,
      action: 'PROJECT_UPDATED',
      entityType: 'PROJECT',
      entityId: updated.id,
      metadata: {
        changedFields: Object.keys(data).filter((key) => (data as any)[key] !== undefined),
      },
    });

    return updated;
  }

  async deleteProject(id: number, userId: number) {
    const project = await this.projectRepository.findById(id);

    if (!project) {
      throw new Error('Project not found');
    }

    if (project.userId !== userId) {
      throw new Error('Unauthorized access');
    }

    await this.auditService.log({
      userId,
      projectId: project.id,
      action: 'PROJECT_DELETED',
      entityType: 'PROJECT',
      entityId: project.id,
      metadata: {
        name: project.name,
      },
    });

    return await this.projectRepository.delete(id);
  }

  async getProjectSummary(id: number, userId: number) {
    const project = await this.projectRepository.findById(id);

    if (!project) {
      throw new Error('Project not found');
    }

    if (project.userId !== userId) {
      throw new Error('Unauthorized access');
    }

    return await this.projectRepository.getSummary(id);
  }

  async setBudget(id: number, budget: number | null, userId: number) {
    const project = await this.projectRepository.findById(id);

    if (!project) {
      throw new Error('Project not found');
    }

    if (project.userId !== userId) {
      throw new Error('Unauthorized access');
    }

    const updated = await this.projectRepository.update(id, { carbonBudget: budget } as any);

    await this.auditService.log({
      userId,
      projectId: updated.id,
      action: budget === null ? 'PROJECT_BUDGET_CLEARED' : 'PROJECT_BUDGET_SET',
      entityType: 'PROJECT',
      entityId: updated.id,
      metadata: {
        previousBudget: project.carbonBudget,
        currentBudget: updated.carbonBudget,
      },
    });

    return updated;
  }

  async getAlerts(id: number, userId: number) {
    const project = await this.projectRepository.findById(id);

    if (!project) {
      throw new Error('Project not found');
    }

    if (project.userId !== userId) {
      throw new Error('Unauthorized access');
    }

    return await this.alertRepository.findByProjectId(id);
  }

  async markAlertsRead(id: number, userId: number) {
    const project = await this.projectRepository.findById(id);

    if (!project) {
      throw new Error('Project not found');
    }

    if (project.userId !== userId) {
      throw new Error('Unauthorized access');
    }

    const unreadBefore = await this.alertRepository.countUnread(id);

    await this.alertRepository.markAllRead(id);

    if (unreadBefore > 0) {
      await this.auditService.log({
        userId,
        projectId: id,
        action: 'PROJECT_ALERTS_MARKED_READ',
        entityType: 'ALERT',
        metadata: {
          markedCount: unreadBefore,
        },
      });
    }
  }

  async getAuditLogs(id: number, userId: number, filters?: { action?: string; page?: number; limit?: number }) {
    return await this.auditService.getProjectAuditLogs(id, userId, filters);
  }
}

export default ProjectService;
