import AuditRepository from '../repositories/audit.repository';
import ProjectRepository from '../repositories/project.repository';

export interface AuditLogWriteInput {
  userId: number;
  projectId?: number;
  action: string;
  entityType: string;
  entityId?: number;
  metadata?: Record<string, unknown>;
}

interface GetProjectAuditLogFilters {
  action?: string;
  page?: number;
  limit?: number;
}

class AuditService {
  private auditRepository: AuditRepository;
  private projectRepository: ProjectRepository;

  constructor() {
    this.auditRepository = new AuditRepository();
    this.projectRepository = new ProjectRepository();
  }

  async log(input: AuditLogWriteInput) {
    return await this.auditRepository.create(input);
  }

  async getProjectAuditLogs(projectId: number, userId: number, filters?: GetProjectAuditLogFilters) {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    if (project.userId !== userId) {
      throw new Error('Unauthorized access');
    }

    return await this.auditRepository.findByProjectId(projectId, userId, filters);
  }
}

export default AuditService;
