import { Request, Response } from 'express';
import ImpactService from '../services/impact.service';

// Controller Layer: Handles HTTP requests/responses (Single Responsibility)
class ImpactController {
  private impactService: ImpactService;

  constructor() {
    this.impactService = new ImpactService();
  }

  // TODO: Implement controller methods
  // - createImpact = async (req, res)
  // - getImpact = async (req, res)
  // - getAllImpacts = async (req, res)
  // - updateImpact = async (req, res)
  // - deleteImpact = async (req, res)
  // - getSummary = async (req, res)
}

export default ImpactController;
