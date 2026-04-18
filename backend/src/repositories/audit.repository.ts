import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';

interface CreateAuditLogInput {
  userId: number;
  projectId?: number;
  action: string;
  entityType: string;
  entityId?: number;
  metadata?: Record<string, unknown>;
}

interface FindProjectAuditLogsFilters {
  action?: string;
  page?: number;
  limit?: number;
}

class AuditRepository {
  async create(data: CreateAuditLogInput) {
    return await prisma.auditLog.create({
      data: {
        ...data,
        projectId: data.projectId ?? null,
        entityId: data.entityId ?? null,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async findByProjectId(projectId: number, filters?: FindProjectAuditLogsFilters) {
    const {
      action,
      page = 1,
      limit = 25,
    } = filters || {};

    const where: any = {
      projectId,
    };

    if (action) {
      where.action = action;
    }

    const [total, data] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
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

export default AuditRepository;
