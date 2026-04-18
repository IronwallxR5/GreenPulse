import prisma from '../config/prisma';
import { OrganizationRole } from '@prisma/client';

class OrganizationRepository {
  async createWithOwner(name: string, createdBy: number) {
    return await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name,
          createdBy,
        },
      });

      await tx.organizationMembership.create({
        data: {
          organizationId: organization.id,
          userId: createdBy,
          role: OrganizationRole.OWNER,
        },
      });

      return organization;
    });
  }

  async findByUserId(userId: number) {
    return await prisma.organization.findMany({
      where: {
        memberships: {
          some: { userId },
        },
      },
      include: {
        memberships: {
          where: { userId },
          select: {
            role: true,
          },
        },
        _count: {
          select: {
            memberships: true,
            projects: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: number) {
    return await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            memberships: true,
            projects: true,
          },
        },
      },
    });
  }

  async findMembership(organizationId: number, userId: number) {
    return await prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });
  }

  async listMembers(organizationId: number) {
    return await prisma.organizationMembership.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  async addMember(organizationId: number, userId: number, role: OrganizationRole) {
    return await prisma.organizationMembership.create({
      data: {
        organizationId,
        userId,
        role,
      },
    });
  }

  async removeMember(organizationId: number, userId: number) {
    return await prisma.organizationMembership.delete({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });
  }
}

export default OrganizationRepository;
