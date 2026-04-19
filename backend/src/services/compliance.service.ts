import { ReportFormat, ReportFrequency } from '@prisma/client';
import ProjectRepository from '../repositories/project.repository';
import ImpactRepository from '../repositories/impact.repository';
import ReportScheduleRepository from '../repositories/reportSchedule.repository';
import ComplianceReportRepository from '../repositories/complianceReport.repository';
import AuditService from './audit.service';
import RbacService, { OrganizationPermission } from './rbac.service';

interface UpsertReportScheduleInput {
  frequency: ReportFrequency;
  format: ReportFormat;
  isActive?: boolean;
  startsAt?: string;
}

interface ComplianceReportFilters {
  page?: number;
  limit?: number;
}

class ComplianceService {
  private projectRepository: ProjectRepository;
  private impactRepository: ImpactRepository;
  private reportScheduleRepository: ReportScheduleRepository;
  private complianceReportRepository: ComplianceReportRepository;
  private auditService: AuditService;
  private rbacService: RbacService;
  private runningDueCheck = false;

  constructor() {
    this.projectRepository = new ProjectRepository();
    this.impactRepository = new ImpactRepository();
    this.reportScheduleRepository = new ReportScheduleRepository();
    this.complianceReportRepository = new ComplianceReportRepository();
    this.auditService = new AuditService();
    this.rbacService = new RbacService();
  }

  private async verifyProjectAccess(projectId: number, userId: number, permission: OrganizationPermission) {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    const hasAccess = this.rbacService.hasProjectPermission(project, userId, permission);

    if (!hasAccess) {
      throw new Error('Unauthorized access');
    }

    return project;
  }

  private getNextRunAt(base: Date, frequency: ReportFrequency): Date {
    const next = new Date(base);

    if (frequency === ReportFrequency.DAILY) {
      next.setDate(next.getDate() + 1);
      return next;
    }

    if (frequency === ReportFrequency.WEEKLY) {
      next.setDate(next.getDate() + 7);
      return next;
    }

    next.setMonth(next.getMonth() + 1);
    return next;
  }

  private parseStartsAt(startsAt?: string): Date | null {
    if (!startsAt) {
      return null;
    }

    const parsed = new Date(startsAt);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error('Invalid startsAt datetime');
    }

    return parsed;
  }

  async getReportSchedule(projectId: number, userId: number) {
    await this.verifyProjectAccess(projectId, userId, 'COMPLIANCE_VIEW');
    return await this.reportScheduleRepository.findByProjectId(projectId);
  }

  async upsertReportSchedule(projectId: number, userId: number, data: UpsertReportScheduleInput) {
    await this.verifyProjectAccess(projectId, userId, 'COMPLIANCE_MANAGE');

    const startsAt = this.parseStartsAt(data.startsAt);
    const base = startsAt ?? new Date();

    const nextRunAt = base > new Date() ? base : this.getNextRunAt(new Date(), data.frequency);

    const schedule = await this.reportScheduleRepository.upsertByProject({
      projectId,
      userId,
      frequency: data.frequency,
      format: data.format,
      isActive: data.isActive ?? true,
      nextRunAt,
    });

    await this.auditService.log({
      userId,
      projectId,
      action: 'REPORT_SCHEDULE_UPDATED',
      entityType: 'REPORT_SCHEDULE',
      entityId: schedule.id,
      metadata: {
        frequency: schedule.frequency,
        format: schedule.format,
        isActive: schedule.isActive,
        nextRunAt: schedule.nextRunAt.toISOString(),
      },
    });

    return schedule;
  }

  async deleteReportSchedule(projectId: number, userId: number) {
    await this.verifyProjectAccess(projectId, userId, 'COMPLIANCE_MANAGE');

    const existing = await this.reportScheduleRepository.findByProjectId(projectId);
    if (!existing) {
      return { deleted: false };
    }

    await this.reportScheduleRepository.deleteByProjectId(projectId);

    await this.auditService.log({
      userId,
      projectId,
      action: 'REPORT_SCHEDULE_DELETED',
      entityType: 'REPORT_SCHEDULE',
      entityId: existing.id,
      metadata: {
        frequency: existing.frequency,
        format: existing.format,
      },
    });

    return { deleted: true };
  }

  async getComplianceReports(projectId: number, userId: number, filters?: ComplianceReportFilters) {
    await this.verifyProjectAccess(projectId, userId, 'COMPLIANCE_VIEW');
    return await this.complianceReportRepository.findByProjectId(projectId, filters);
  }

  private async createComplianceReportSnapshot(input: {
    projectId: number;
    userId: number;
    format: ReportFormat;
    scheduleId?: number;
  }) {
    const summary = await this.impactRepository.getSummaryByProjectId(input.projectId);

    const report = await this.complianceReportRepository.create({
      projectId: input.projectId,
      userId: input.userId,
      scheduleId: input.scheduleId,
      format: input.format,
      totalCO2: summary.totalCO2,
      totalLogs: summary.totalLogs,
      byType: summary.byType,
    });

    await this.auditService.log({
      userId: input.userId,
      projectId: input.projectId,
      action: 'COMPLIANCE_REPORT_GENERATED',
      entityType: 'COMPLIANCE_REPORT',
      entityId: report.id,
      metadata: {
        format: report.format,
        totalCO2: report.totalCO2,
        totalLogs: report.totalLogs,
      },
    });

    return report;
  }

  async runComplianceReportNow(projectId: number, userId: number, format?: ReportFormat) {
    await this.verifyProjectAccess(projectId, userId, 'COMPLIANCE_MANAGE');

    const schedule = await this.reportScheduleRepository.findByProjectId(projectId);
    const resolvedFormat = format ?? schedule?.format ?? ReportFormat.PDF;

    return await this.createComplianceReportSnapshot({
      projectId,
      userId,
      format: resolvedFormat,
      scheduleId: schedule?.id,
    });
  }

  async runDueSchedules() {
    if (this.runningDueCheck) {
      return;
    }

    this.runningDueCheck = true;

    try {
      const now = new Date();
      const dueSchedules = await this.reportScheduleRepository.findDueSchedules(now);

      for (const schedule of dueSchedules) {
        try {
          await this.createComplianceReportSnapshot({
            projectId: schedule.projectId,
            userId: schedule.userId,
            format: schedule.format,
            scheduleId: schedule.id,
          });

          const completedAt = new Date();
          const nextRunAt = this.getNextRunAt(completedAt, schedule.frequency);

          await this.reportScheduleRepository.updateRunState(schedule.id, nextRunAt, completedAt);
        } catch (error) {
          console.error('[ComplianceService] Failed to run schedule', schedule.id, error);
        }
      }
    } finally {
      this.runningDueCheck = false;
    }
  }
}

export default ComplianceService;
