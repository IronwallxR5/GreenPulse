import prisma from '../config/prisma';
import { Prisma, ReportFormat } from '@prisma/client';

interface CreateComplianceReportInput {
  projectId: number;
  userId: number;
  scheduleId?: number;
  format: ReportFormat;
  totalCO2: number;
  totalLogs: number;
  byType: Array<{ type: string; totalCO2: number; count: number }>;
}

interface FindComplianceReportsFilters {
  page?: number;
  limit?: number;
}

class ComplianceReportRepository {
  async create(data: CreateComplianceReportInput) {
    return await prisma.complianceReport.create({
      data: {
        projectId: data.projectId,
        userId: data.userId,
        scheduleId: data.scheduleId ?? null,
        format: data.format,
        totalCO2: data.totalCO2,
        totalLogs: data.totalLogs,
        byType: data.byType as Prisma.InputJsonValue,
      },
    });
  }

  async findByProjectId(projectId: number, filters?: FindComplianceReportsFilters) {
    const {
      page = 1,
      limit = 10,
    } = filters || {};

    const where = { projectId };

    const [total, data] = await Promise.all([
      prisma.complianceReport.count({ where }),
      prisma.complianceReport.findMany({
        where,
        orderBy: { generatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default ComplianceReportRepository;
