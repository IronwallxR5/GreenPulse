import ProjectRepository from '../repositories/project.repository';
import AlertRepository from '../repositories/alert.repository';
import { CreateProjectDTO, UpdateProjectDTO } from '../utils/interfaces';
import AuditService from './audit.service';
import OrganizationService from './organization.service';

class ProjectService {
  private projectRepository: ProjectRepository;
  private alertRepository: AlertRepository;
  private auditService: AuditService;
  private organizationService: OrganizationService;

  constructor() {
    this.projectRepository = new ProjectRepository();
    this.alertRepository = new AlertRepository();
    this.auditService = new AuditService();
    this.organizationService = new OrganizationService();
  }

  private hasProjectReadAccess(project: any, userId: number) {
    if (!project.organizationId) {
      return project.userId === userId;
    }

    return project.organization?.memberships?.some((membership: any) => membership.userId === userId);
  }

  private hasProjectManageAccess(project: any, userId: number) {
    if (!project.organizationId) {
      return project.userId === userId;
    }

    const membership = project.organization?.memberships?.find((m: any) => m.userId === userId);
    return membership?.role === 'OWNER';
  }

  private async getProjectWithReadAccess(id: number, userId: number) {
    const project = await this.projectRepository.findById(id);

    if (!project) {
      throw new Error('Project not found');
    }

    if (!this.hasProjectReadAccess(project, userId)) {
      throw new Error('Unauthorized access');
    }

    return project;
  }

  private async getProjectWithManageAccess(id: number, userId: number) {
    const project = await this.projectRepository.findById(id);

    if (!project) {
      throw new Error('Project not found');
    }

    if (!this.hasProjectManageAccess(project, userId)) {
      throw new Error('Unauthorized access');
    }

    return project;
  }

  async createProject(data: CreateProjectDTO, userId: number) {
    if (data.organizationId) {
      const membership = await this.organizationService.getMembership(data.organizationId, userId);
      if (!membership) {
        throw new Error('Unauthorized organization access');
      }
    }

    const project = await this.projectRepository.create({ ...data, userId });

    await this.auditService.log({
      userId,
      projectId: project.id,
      action: 'PROJECT_CREATED',
      entityType: 'PROJECT',
      entityId: project.id,
      metadata: {
        name: project.name,
        organizationId: project.organizationId ?? null,
      },
    });

    return project;
  }

  async getProjectById(id: number, userId: number) {
    return await this.getProjectWithReadAccess(id, userId);
  }

  async getAllProjects(userId: number) {
    return await this.projectRepository.findByUserId(userId);
  }

  async updateProject(id: number, data: UpdateProjectDTO, userId: number) {
    const project = await this.getProjectWithManageAccess(id, userId);

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
    const project = await this.getProjectWithManageAccess(id, userId);

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
    await this.getProjectWithReadAccess(id, userId);

    return await this.projectRepository.getSummary(id);
  }

  async setBudget(id: number, budget: number | null, userId: number) {
    const project = await this.getProjectWithManageAccess(id, userId);

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
    await this.getProjectWithReadAccess(id, userId);

    return await this.alertRepository.findByProjectId(id);
  }

  async markAlertsRead(id: number, userId: number) {
    await this.getProjectWithReadAccess(id, userId);

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
    await this.getProjectWithReadAccess(id, userId);
    return await this.auditService.getProjectAuditLogs(id, userId, filters);
  }
}

export default ProjectService;
