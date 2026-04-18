import { Request, Response } from 'express';
import ProjectService from '../services/project.service';
import { ReportingService } from '../services/reporting/ReportingService';
import { PdfReportStrategy } from '../services/reporting/PdfReportStrategy';
import { CsvReportStrategy } from '../services/reporting/CsvReportStrategy';
import { NotificationService } from '../services/notifications/NotificationService';
import { StatusCodes } from 'http-status-codes';

class ProjectController {
  private projectService: ProjectService;
  private reportingService: ReportingService;
  private notificationService: NotificationService;

  constructor() {
    this.projectService = new ProjectService();
    this.reportingService = new ReportingService();
    this.notificationService = NotificationService.getInstance();
  }

  createProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const project = await this.projectService.createProject(req.body, userId);
      res.status(StatusCodes.CREATED).json(project);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create project';
      res.status(StatusCodes.BAD_REQUEST).json({ message });
    }
  };

  getProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const id = parseInt(String(req.params.id));
      const project = await this.projectService.getProjectById(id, userId);
      res.status(StatusCodes.OK).json(project);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get project';
      const status = message === 'Project not found' ? StatusCodes.NOT_FOUND : StatusCodes.FORBIDDEN;
      res.status(status).json({ message });
    }
  };

  getAllProjects = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const projects = await this.projectService.getAllProjects(userId);
      res.status(StatusCodes.OK).json(projects);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get projects';
      res.status(StatusCodes.BAD_REQUEST).json({ message });
    }
  };

  updateProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const id = parseInt(String(req.params.id));
      const project = await this.projectService.updateProject(id, req.body, userId);
      res.status(StatusCodes.OK).json(project);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update project';
      const status = message === 'Project not found' ? StatusCodes.NOT_FOUND : StatusCodes.FORBIDDEN;
      res.status(status).json({ message });
    }
  };

  deleteProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const id = parseInt(String(req.params.id));
      await this.projectService.deleteProject(id, userId);
      res.status(StatusCodes.OK).json({ message: 'Project deleted successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete project';
      const status = message === 'Project not found' ? StatusCodes.NOT_FOUND : StatusCodes.FORBIDDEN;
      res.status(status).json({ message });
    }
  };

  getProjectSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const id = parseInt(String(req.params.id));
      const summary = await this.projectService.getProjectSummary(id, userId);
      res.status(StatusCodes.OK).json(summary);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get project summary';
      const status = message === 'Project not found' ? StatusCodes.NOT_FOUND : StatusCodes.FORBIDDEN;
      res.status(status).json({ message });
    }
  };

  getProjectReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const id = parseInt(String(req.params.id));
      const format = req.query.format as string || 'pdf';

      await this.projectService.getProjectById(id, userId);

      if (format.toLowerCase() === 'csv') {
        this.reportingService.setStrategy(new CsvReportStrategy());
      } else {
        this.reportingService.setStrategy(new PdfReportStrategy());
      }

      const { file, contentType, filename } = await this.reportingService.generateReport(id);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      if (file instanceof Buffer) {
        res.send(file);
      } else {
        res.send(file);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate report';
      const status = message === 'Project not found' ? StatusCodes.NOT_FOUND : StatusCodes.FORBIDDEN;
      res.status(status).json({ message });
    }
  };

  setBudget = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const id = parseInt(String(req.params.id));
      const budget = req.body.carbonBudget;
      // null clears the budget; a positive number sets it
      const parsed = budget === null ? null : parseFloat(budget);
      if (parsed !== null && (isNaN(parsed) || parsed <= 0)) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'carbonBudget must be a positive number or null to clear' });
        return;
      }
      const project = await this.projectService.setBudget(id, parsed, userId);
      res.status(StatusCodes.OK).json(project);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set budget';
      const status = message === 'Project not found' ? StatusCodes.NOT_FOUND : StatusCodes.FORBIDDEN;
      res.status(status).json({ message });
    }
  };

  getAlerts = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const id = parseInt(String(req.params.id));
      const alerts = await this.projectService.getAlerts(id, userId);
      res.status(StatusCodes.OK).json(alerts);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get alerts';
      const status = message === 'Project not found' ? StatusCodes.NOT_FOUND : StatusCodes.FORBIDDEN;
      res.status(status).json({ message });
    }
  };

  getAuditLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const id = parseInt(String(req.params.id));
      const action = req.query.action ? String(req.query.action) : undefined;
      const page = req.query.page ? parseInt(String(req.query.page)) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit)) : undefined;

      const auditLogs = await this.projectService.getAuditLogs(id, userId, { action, page, limit });
      res.status(StatusCodes.OK).json(auditLogs);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get audit logs';
      const status = message === 'Project not found' ? StatusCodes.NOT_FOUND : StatusCodes.FORBIDDEN;
      res.status(status).json({ message });
    }
  };

  markAlertsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const id = parseInt(String(req.params.id));
      await this.projectService.markAlertsRead(id, userId);
      res.status(StatusCodes.OK).json({ message: 'All alerts marked as read' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mark alerts';
      const status = message === 'Project not found' ? StatusCodes.NOT_FOUND : StatusCodes.FORBIDDEN;
      res.status(status).json({ message });
    }
  };

  streamAlerts = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const id = parseInt(String(req.params.id));

      await this.projectService.getProjectById(id, userId);

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      res.write(`event: connected\ndata: ${JSON.stringify({ projectId: id, timestamp: new Date().toISOString() })}\n\n`);

      const observer = (projectId: number, totalCO2: number, budget: number) => {
        if (projectId !== id) {
          return;
        }

        const payload = {
          projectId,
          totalCO2,
          budget,
          message: `Carbon budget exceeded. Total CO2 ${totalCO2.toFixed(4)} kg vs budget ${budget.toFixed(4)} kg.`,
          timestamp: new Date().toISOString(),
        };

        res.write(`event: alert\ndata: ${JSON.stringify(payload)}\n\n`);
      };

      this.notificationService.subscribe(observer);

      const heartbeat = setInterval(() => {
        res.write(`: keepalive ${Date.now()}\n\n`);
      }, 25000);

      let closed = false;
      const cleanup = () => {
        if (closed) {
          return;
        }
        closed = true;
        clearInterval(heartbeat);
        this.notificationService.unsubscribe(observer);
        res.end();
      };

      req.on('close', cleanup);
      req.on('end', cleanup);
      res.on('close', cleanup);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to stream alerts';
      const status = message === 'Project not found' ? StatusCodes.NOT_FOUND : StatusCodes.FORBIDDEN;
      res.status(status).json({ message });
    }
  };
}

export default ProjectController;
