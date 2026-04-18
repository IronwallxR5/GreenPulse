import prisma from '../config/prisma';
import { ReportFormat, ReportFrequency } from '@prisma/client';

interface UpsertReportScheduleInput {
  projectId: number;
  userId: number;
  frequency: ReportFrequency;
  format: ReportFormat;
  isActive: boolean;
  nextRunAt: Date;
}

class ReportScheduleRepository {
  async findByProjectId(projectId: number) {
    return await prisma.reportSchedule.findUnique({
      where: { projectId },
    });
  }

  async upsertByProject(data: UpsertReportScheduleInput) {
    return await prisma.reportSchedule.upsert({
      where: { projectId: data.projectId },
      create: data,
      update: {
        userId: data.userId,
        frequency: data.frequency,
        format: data.format,
        isActive: data.isActive,
        nextRunAt: data.nextRunAt,
      },
    });
  }

  async deleteByProjectId(projectId: number) {
    return await prisma.reportSchedule.delete({ where: { projectId } });
  }

  async findDueSchedules(now: Date, limit = 25) {
    return await prisma.reportSchedule.findMany({
      where: {
        isActive: true,
        nextRunAt: {
          lte: now,
        },
      },
      orderBy: { nextRunAt: 'asc' },
      take: limit,
    });
  }

  async updateRunState(id: number, nextRunAt: Date, lastRunAt: Date) {
    return await prisma.reportSchedule.update({
      where: { id },
      data: {
        nextRunAt,
        lastRunAt,
      },
    });
  }
}

export default ReportScheduleRepository;
