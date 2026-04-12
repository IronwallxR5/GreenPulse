import prisma from '../config/prisma';

class AlertRepository {
  /**
   * Create a new alert for a project.
   */
  async create(data: { projectId: number; message: string; totalCO2: number; budget: number }) {
    return await prisma.alert.create({ data });
  }

  /**
   * Get all alerts for a project, newest first.
   */
  async findByProjectId(projectId: number) {
    return await prisma.alert.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mark a single alert as read.
   */
  async markRead(id: number) {
    return await prisma.alert.update({ where: { id }, data: { isRead: true } });
  }

  /**
   * Mark all unread alerts for a project as read.
   */
  async markAllRead(projectId: number) {
    return await prisma.alert.updateMany({
      where: { projectId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Count unread alerts for a project.
   */
  async countUnread(projectId: number) {
    return await prisma.alert.count({ where: { projectId, isRead: false } });
  }
}

export default AlertRepository;
