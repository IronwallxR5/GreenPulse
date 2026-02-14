import prisma from '../config/prisma';
import { CreateProjectDTO, UpdateProjectDTO } from '../utils/interfaces';

class ProjectRepository {
  async create(data: CreateProjectDTO & { userId: number }) {
    return await prisma.project.create({ data });
  }

  async findById(id: number) {
    return await prisma.project.findUnique({
      where: { id },
      include: {
        _count: { select: { impactLogs: true } },
      },
    });
  }

  async findByUserId(userId: number) {
    return await prisma.project.findMany({
      where: { userId },
      include: {
        _count: { select: { impactLogs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: number, data: UpdateProjectDTO) {
    return await prisma.project.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return await prisma.project.delete({ where: { id } });
  }

  async getSummary(id: number) {
    const totalCO2 = await prisma.impactLog.aggregate({
      where: { projectId: id },
      _sum: { carbonScore: true },
      _count: true,
    });

    const byType = await prisma.impactLog.groupBy({
      by: ['type'],
      where: { projectId: id },
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

export default ProjectRepository;
