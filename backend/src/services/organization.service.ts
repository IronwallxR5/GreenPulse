import { OrganizationRole } from '@prisma/client';
import OrganizationRepository from '../repositories/organization.repository';
import UserRepository from '../repositories/user.repository';
import AuditService from './audit.service';
import RbacService from './rbac.service';

class OrganizationService {
  private organizationRepository: OrganizationRepository;
  private userRepository: UserRepository;
  private auditService: AuditService;
  private rbacService: RbacService;

  constructor() {
    this.organizationRepository = new OrganizationRepository();
    this.userRepository = new UserRepository();
    this.auditService = new AuditService();
    this.rbacService = new RbacService();
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

    if (!this.rbacService.hasOrganizationPermission(membership.role, 'ORG_MEMBER_MANAGE')) {
      throw new Error('Insufficient permissions to add organization members');
    }

    if (role === OrganizationRole.OWNER && membership.role !== OrganizationRole.OWNER) {
      throw new Error('Only organization owners can assign OWNER role');
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

  async updateOrganizationMemberRole(
    organizationId: number,
    requesterUserId: number,
    targetUserId: number,
    newRole: OrganizationRole,
  ) {
    const { membership } = await this.getOrganizationAndMembership(organizationId, requesterUserId);

    if (!this.rbacService.hasOrganizationPermission(membership.role, 'ORG_MEMBER_MANAGE')) {
      throw new Error('Insufficient permissions to update organization member roles');
    }

    const targetMembership = await this.organizationRepository.findMembership(organizationId, targetUserId);
    if (!targetMembership) {
      throw new Error('Organization member not found');
    }

    if (targetMembership.role === OrganizationRole.OWNER && membership.role !== OrganizationRole.OWNER) {
      throw new Error('Only organization owners can update owner roles');
    }

    if (newRole === OrganizationRole.OWNER && membership.role !== OrganizationRole.OWNER) {
      throw new Error('Only organization owners can assign OWNER role');
    }

    if (targetMembership.role === OrganizationRole.OWNER && newRole !== OrganizationRole.OWNER) {
      const members = await this.organizationRepository.listMembers(organizationId);
      const ownerCount = members.filter((m) => m.role === OrganizationRole.OWNER).length;
      if (ownerCount <= 1) {
        throw new Error('Cannot demote the last organization owner');
      }
    }

    const updatedMembership = await this.organizationRepository.updateMemberRole(
      organizationId,
      targetUserId,
      newRole,
    );

    await this.auditService.log({
      userId: requesterUserId,
      action: 'ORGANIZATION_MEMBER_ROLE_UPDATED',
      entityType: 'ORGANIZATION',
      entityId: organizationId,
      metadata: {
        targetUserId,
        previousRole: targetMembership.role,
        newRole,
      },
    });

    return updatedMembership;
  }

  async removeOrganizationMember(organizationId: number, requesterUserId: number, targetUserId: number) {
    const { membership } = await this.getOrganizationAndMembership(organizationId, requesterUserId);

    if (!this.rbacService.hasOrganizationPermission(membership.role, 'ORG_MEMBER_MANAGE')) {
      throw new Error('Insufficient permissions to remove organization members');
    }

    const targetMembership = await this.organizationRepository.findMembership(organizationId, targetUserId);
    if (!targetMembership) {
      throw new Error('Organization member not found');
    }

    if (targetMembership.role === OrganizationRole.OWNER && membership.role !== OrganizationRole.OWNER) {
      throw new Error('Only organization owners can remove owners');
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
