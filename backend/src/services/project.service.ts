import ProjectRepository from '../repositories/project.repository';
import AlertRepository from '../repositories/alert.repository';
import { CreateProjectDTO, UpdateProjectDTO } from '../utils/interfaces';

class ProjectService {
  private projectRepository: ProjectRepository;
  private alertRepository: AlertRepository;

  constructor() {
    this.projectRepository = new ProjectRepository();
    this.alertRepository = new AlertRepository();
  }

  async createProject(data: CreateProjectDTO, userId: number) {
    return await this.projectRepository.create({ ...data, userId });
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

    return await this.projectRepository.update(id, data);
  }

  async deleteProject(id: number, userId: number) {
    const project = await this.projectRepository.findById(id);

    if (!project) {
      throw new Error('Project not found');
    }

    if (project.userId !== userId) {
      throw new Error('Unauthorized access');
    }

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

    return await this.projectRepository.update(id, { carbonBudget: budget } as any);
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

    await this.alertRepository.markAllRead(id);
  }
}

export default ProjectService;
