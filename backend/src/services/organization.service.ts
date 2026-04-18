import { OrganizationRole } from '@prisma/client';
import OrganizationRepository from '../repositories/organization.repository';
import UserRepository from '../repositories/user.repository';
import AuditService from './audit.service';

class OrganizationService {
  private organizationRepository: OrganizationRepository;
  private userRepository: UserRepository;
  private auditService: AuditService;

  constructor() {
    this.organizationRepository = new OrganizationRepository();
    this.userRepository = new UserRepository();
    this.auditService = new AuditService();
  }

  private async getOrganizationAndMembership(organizationId: number, userId: number) {
    const organization = await this.organizationRepository.findById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    const membership = await this.organizationRepository.findMembership(organizationId, userId);
    if (!membership) {
      throw new Error('Unauthorized organization access');
    }

    return { organization, membership };
  }

  async getMembership(organizationId: number, userId: number) {
    return await this.organizationRepository.findMembership(organizationId, userId);
  }

  async createOrganization(name: string, userId: number) {
    if (!name.trim()) {
      throw new Error('Organization name is required');
    }

    const organization = await this.organizationRepository.createWithOwner(name.trim(), userId);

    await this.auditService.log({
      userId,
      action: 'ORGANIZATION_CREATED',
      entityType: 'ORGANIZATION',
      entityId: organization.id,
      metadata: {
        organizationName: organization.name,
      },
    });

    return organization;
  }

  async getOrganizations(userId: number) {
    return await this.organizationRepository.findByUserId(userId);
  }

  async getOrganizationMembers(organizationId: number, userId: number) {
    await this.getOrganizationAndMembership(organizationId, userId);
    return await this.organizationRepository.listMembers(organizationId);
  }

  async addOrganizationMember(
    organizationId: number,
    requesterUserId: number,
    email: string,
    role: OrganizationRole,
  ) {
    const { membership } = await this.getOrganizationAndMembership(organizationId, requesterUserId);

    if (membership.role !== OrganizationRole.OWNER) {
      throw new Error('Only organization owners can add members');
    }

    const user = await this.userRepository.findByEmail(email.trim().toLowerCase());
    if (!user) {
      throw new Error('User with this email does not exist');
    }

    const existing = await this.organizationRepository.findMembership(organizationId, user.id);
    if (existing) {
      throw new Error('User is already a member of this organization');
    }

    const member = await this.organizationRepository.addMember(organizationId, user.id, role);

    await this.auditService.log({
      userId: requesterUserId,
      action: 'ORGANIZATION_MEMBER_ADDED',
      entityType: 'ORGANIZATION',
      entityId: organizationId,
      metadata: {
        addedUserId: user.id,
        addedUserEmail: user.email,
        role,
      },
    });

    return member;
  }

  async removeOrganizationMember(organizationId: number, requesterUserId: number, targetUserId: number) {
    const { membership } = await this.getOrganizationAndMembership(organizationId, requesterUserId);

    if (membership.role !== OrganizationRole.OWNER) {
      throw new Error('Only organization owners can remove members');
    }

    const targetMembership = await this.organizationRepository.findMembership(organizationId, targetUserId);
    if (!targetMembership) {
      throw new Error('Organization member not found');
    }

    if (targetMembership.role === OrganizationRole.OWNER) {
      const members = await this.organizationRepository.listMembers(organizationId);
      const ownerCount = members.filter((m) => m.role === OrganizationRole.OWNER).length;
      if (ownerCount <= 1) {
        throw new Error('Cannot remove the last organization owner');
      }
    }

    await this.organizationRepository.removeMember(organizationId, targetUserId);

    await this.auditService.log({
      userId: requesterUserId,
      action: 'ORGANIZATION_MEMBER_REMOVED',
      entityType: 'ORGANIZATION',
      entityId: organizationId,
      metadata: {
        removedUserId: targetUserId,
      },
    });

    return { removed: true };
  }
}

export default OrganizationService;
