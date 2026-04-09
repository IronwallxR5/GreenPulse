import { ImpactLog } from '@prisma/client';

export interface ReportData {
  projectName: string;
  generatedAt: string;
  totalCO2: number;
  totalLogs: number;
  byType: { type: string; totalCO2: number; count: number }[];
  impacts: ImpactLog[];
}

export interface IReportStrategy {
  generate(data: ReportData): Promise<Buffer | string> | Buffer | string;
  contentType: string;
  fileExtension: string;
}
