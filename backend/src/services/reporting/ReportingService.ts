import { IReportStrategy, ReportData } from './IReportStrategy';
import ImpactRepository from '../../repositories/impact.repository';
import ProjectRepository from '../../repositories/project.repository';

export class ReportingService {
  private strategy: IReportStrategy | null = null;
  private impactRepo: ImpactRepository;
  private projectRepo: ProjectRepository;

  constructor() {
    this.impactRepo = new ImpactRepository();
    this.projectRepo = new ProjectRepository();
  }

  setStrategy(strategy: IReportStrategy) {
    this.strategy = strategy;
  }

  async generateReport(projectId: number): Promise<{ file: Buffer | string; contentType: string; filename: string }> {
    if (!this.strategy) {
      throw new Error('Report strategy is not set.');
    }

    const project = await this.projectRepo.findById(projectId);
    if (!project) throw new Error('Project not found');

    const summary = await this.impactRepo.getSummaryByProjectId(projectId);
    
    const { data: impacts } = await this.impactRepo.findByProjectId(projectId, { limit: 10000 });

    const reportData: ReportData = {
      projectName: project.name,
      generatedAt: new Date().toISOString(),
      totalCO2: summary.totalCO2,
      totalLogs: summary.totalLogs,
      byType: summary.byType,
      impacts,
    };

    const file = await this.strategy.generate(reportData);

    return {
      file,
      contentType: this.strategy.contentType,
      filename: `greenpulse-report-${project.id}-${Date.now()}.${this.strategy.fileExtension}`,
    };
  }
}
