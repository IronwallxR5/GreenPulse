import { OrganizationRole } from '@prisma/client';

export type OrganizationPermission =
  | 'PROJECT_VIEW'
  | 'PROJECT_EDIT'
  | 'PROJECT_DELETE'
  | 'PROJECT_BUDGET_MANAGE'
  | 'IMPACT_VIEW'
  | 'IMPACT_EDIT'
  | 'COMPLIANCE_VIEW'
  | 'COMPLIANCE_MANAGE'
  | 'AUDIT_VIEW'
  | 'ORG_MEMBER_MANAGE'
  | 'ORG_ROLE_MANAGE';

const rolePermissions: Record<OrganizationRole, OrganizationPermission[]> = {
  OWNER: [
    'PROJECT_VIEW',
    'PROJECT_EDIT',
    'PROJECT_DELETE',
    'PROJECT_BUDGET_MANAGE',
    'IMPACT_VIEW',
    'IMPACT_EDIT',
    'COMPLIANCE_VIEW',
    'COMPLIANCE_MANAGE',
    'AUDIT_VIEW',
    'ORG_MEMBER_MANAGE',
    'ORG_ROLE_MANAGE',
  ],
  ADMIN: [
    'PROJECT_VIEW',
    'PROJECT_EDIT',
    'PROJECT_BUDGET_MANAGE',
    'IMPACT_VIEW',
    'IMPACT_EDIT',
    'COMPLIANCE_VIEW',
    'COMPLIANCE_MANAGE',
    'AUDIT_VIEW',
    'ORG_MEMBER_MANAGE',
  ],
  MEMBER: [
    'PROJECT_VIEW',
    'IMPACT_VIEW',
    'IMPACT_EDIT',
    'COMPLIANCE_VIEW',
  ],
};

interface ProjectMembership {
  userId: number;
  role: OrganizationRole;
}

interface ProjectAccessShape {
  userId: number;
  organizationId?: number | null;
  organization?: {
    memberships?: ProjectMembership[];
  } | null;
}

class RbacService {
  hasOrganizationPermission(role: OrganizationRole, permission: OrganizationPermission) {
    return rolePermissions[role].includes(permission);
  }

  getOrganizationMembershipRole(project: ProjectAccessShape, userId: number): OrganizationRole | null {
    if (!project.organizationId) {
      return null;
    }

    const membership = project.organization?.memberships?.find((m) => m.userId === userId);
    return membership?.role || null;
  }

  hasProjectPermission(project: ProjectAccessShape, userId: number, permission: OrganizationPermission) {
    // Personal projects are controlled by creator.
    if (!project.organizationId) {
      if (project.userId !== userId) {
        return false;
      }

      return true;
    }

    const role = this.getOrganizationMembershipRole(project, userId);
    if (!role) {
      return false;
    }

    return this.hasOrganizationPermission(role, permission);
  }
}

export default RbacService;
