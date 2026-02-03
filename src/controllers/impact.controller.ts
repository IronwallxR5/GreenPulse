import { Request, Response } from 'express';
import ImpactService from '../services/impact.service';
import { StatusCodes } from 'http-status-codes';
import { ImpactType } from '@prisma/client';

class ImpactController {
  private impactService: ImpactService;

  constructor() {
    this.impactService = new ImpactService();
  }

  createImpact = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const impact = await this.impactService.createImpact(req.body, userId);
      res.status(StatusCodes.CREATED).json(impact);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create impact';
      res.status(StatusCodes.BAD_REQUEST).json({ message });
    }
  };

  getImpact = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const id = parseInt(String(req.params.id));
      const impact = await this.impactService.getImpactById(id, userId);
      res.status(StatusCodes.OK).json(impact);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get impact';
      const status = message === 'Impact not found' ? StatusCodes.NOT_FOUND : StatusCodes.FORBIDDEN;
      res.status(status).json({ message });
    }
  };

  getAllImpacts = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const filters = {
        type: req.query.type as ImpactType | undefined,
        search: req.query.search as string | undefined,
        sortBy: req.query.sortBy as 'createdAt' | 'carbonScore' | 'name' | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const result = await this.impactService.getAllImpacts(userId, filters);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get impacts';
      res.status(StatusCodes.BAD_REQUEST).json({ message });
    }
  };

  updateImpact = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const id = parseInt(String(req.params.id));
      const impact = await this.impactService.updateImpact(id, req.body, userId);
      res.status(StatusCodes.OK).json(impact);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update impact';
      const status = message === 'Impact not found' ? StatusCodes.NOT_FOUND : StatusCodes.FORBIDDEN;
      res.status(status).json({ message });
    }
  };

  deleteImpact = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const id = parseInt(String(req.params.id));
      await this.impactService.deleteImpact(id, userId);
      res.status(StatusCodes.OK).json({ message: 'Impact deleted successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete impact';
      const status = message === 'Impact not found' ? StatusCodes.NOT_FOUND : StatusCodes.FORBIDDEN;
      res.status(status).json({ message });
    }
  };

  getSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const summary = await this.impactService.getSummary(userId);
      res.status(StatusCodes.OK).json(summary);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get summary';
      res.status(StatusCodes.BAD_REQUEST).json({ message });
    }
  };
}

export default ImpactController;
