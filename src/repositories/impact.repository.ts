import prisma from '../config/prisma';
import { ImpactType } from '@prisma/client';
import { CreateImpactDTO, UpdateImpactDTO } from '../utils/interfaces';

interface FindByUserIdFilters {
  type?: ImpactType;
  search?: string;
  sortBy?: 'createdAt' | 'carbonScore' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

class ImpactRepository {
  async create(data: CreateImpactDTO & { carbonScore: number; userId: number }) {
    return await prisma.impactLog.create({ data });
  }

  async findById(id: number) {
    return await prisma.impactLog.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async findByUserId(userId: number, filters?: FindByUserIdFilters) {
    const {
      type,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = filters || {};

    const where: any = { userId };

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.impactLog.count({ where }),
      prisma.impactLog.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
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

  async update(id: number, data: UpdateImpactDTO & { carbonScore?: number }) {
    return await prisma.impactLog.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return await prisma.impactLog.delete({ where: { id } });
  }

  async getSummaryByUserId(userId: number) {
    const totalCO2 = await prisma.impactLog.aggregate({
      where: { userId },
      _sum: { carbonScore: true },
      _count: true,
    });

    const byType = await prisma.impactLog.groupBy({
      by: ['type'],
      where: { userId },
      _sum: { carbonScore: true },
      _count: true,
    });

    return {
      totalCO2: totalCO2._sum.carbonScore || 0,
      totalLogs: totalCO2._count,
      byType: byType.map((item) => ({
        type: item.type,
        totalCO2: item._sum.carbonScore || 0,
        count: item._count,
      })),
    };
  }
}

export default ImpactRepository;
