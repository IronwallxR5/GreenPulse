import { Router } from 'express';
import { Routes } from '../utils/interfaces';
import { authenticateToken } from '../middleware/auth.middleware';
import OrganizationController from '../controllers/organization.controller';

class OrganizationRoutes implements Routes {
  path = '/api/organizations';
  router: Router = Router();
  private organizationController: OrganizationController;

  constructor() {
    this.organizationController = new OrganizationController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, authenticateToken, this.organizationController.createOrganization);

    this.router.get(`${this.path}`, authenticateToken, this.organizationController.getOrganizations);

    this.router.get(`${this.path}/:id/members`, authenticateToken, this.organizationController.getOrganizationMembers);

    this.router.post(`${this.path}/:id/members`, authenticateToken, this.organizationController.addOrganizationMember);

    this.router.patch(
      `${this.path}/:id/members/:memberUserId/role`,
      authenticateToken,
      this.organizationController.updateOrganizationMemberRole,
    );

    this.router.delete(
      `${this.path}/:id/members/:memberUserId`,
      authenticateToken,
      this.organizationController.removeOrganizationMember,
    );
  }
}

export default OrganizationRoutes;
