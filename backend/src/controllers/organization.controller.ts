import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { OrganizationRole } from '@prisma/client';
import OrganizationService from '../services/organization.service';

class OrganizationController {
  private organizationService: OrganizationService;

  constructor() {
    this.organizationService = new OrganizationService();
  }

  createOrganization = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const name = String(req.body.name || '');
      const organization = await this.organizationService.createOrganization(name, userId);
      res.status(StatusCodes.CREATED).json(organization);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create organization';
      const status =
        message === 'Organization name is required'
          ? StatusCodes.BAD_REQUEST
          : StatusCodes.FORBIDDEN;
      res.status(status).json({ message });
    }
  };

  getOrganizations = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const organizations = await this.organizationService.getOrganizations(userId);
      res.status(StatusCodes.OK).json(organizations);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get organizations';
      res.status(StatusCodes.BAD_REQUEST).json({ message });
    }
  };

  getOrganizationMembers = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const organizationId = parseInt(String(req.params.id));
      const members = await this.organizationService.getOrganizationMembers(organizationId, userId);
      res.status(StatusCodes.OK).json(members);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get organization members';
      const status = message === 'Organization not found'
        ? StatusCodes.NOT_FOUND
        : StatusCodes.FORBIDDEN;
      res.status(status).json({ message });
    }
  };

  addOrganizationMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const requesterUserId = req.userId!;
      const organizationId = parseInt(String(req.params.id));
      const email = String(req.body.email || '').trim();
      const roleRaw = String(req.body.role || 'MEMBER').toUpperCase();

      if (!email) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'email is required' });
        return;
      }

      if (!Object.values(OrganizationRole).includes(roleRaw as OrganizationRole)) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'role must be OWNER or MEMBER' });
        return;
      }

      const member = await this.organizationService.addOrganizationMember(
        organizationId,
        requesterUserId,
        email,
        roleRaw as OrganizationRole,
      );

      res.status(StatusCodes.CREATED).json(member);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add organization member';
      const status =
        message === 'Organization not found'
          ? StatusCodes.NOT_FOUND
          : message === 'User with this email does not exist' || message === 'User is already a member of this organization'
            ? StatusCodes.BAD_REQUEST
            : StatusCodes.FORBIDDEN;
      res.status(status).json({ message });
    }
  };

  removeOrganizationMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const requesterUserId = req.userId!;
      const organizationId = parseInt(String(req.params.id));
      const targetUserId = parseInt(String(req.params.memberUserId));

      if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid member user id' });
        return;
      }

      await this.organizationService.removeOrganizationMember(organizationId, requesterUserId, targetUserId);
      res.status(StatusCodes.OK).json({ message: 'Organization member removed successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove organization member';
      const status =
        message === 'Organization not found'
          ? StatusCodes.NOT_FOUND
          : message === 'Organization member not found' || message === 'Cannot remove the last organization owner'
            ? StatusCodes.BAD_REQUEST
            : StatusCodes.FORBIDDEN;
      res.status(status).json({ message });
    }
  };
}

export default OrganizationController;
