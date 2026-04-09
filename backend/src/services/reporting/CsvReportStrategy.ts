import { IReportStrategy, ReportData } from './IReportStrategy';

/**
 * CsvReportStrategy — Strategy Pattern implementation.
 * Generates a plain CSV file from ReportData without any external dependency.
 */
export class CsvReportStrategy implements IReportStrategy {
  contentType   = 'text/csv';
  fileExtension = 'csv';

  generate(data: ReportData): string {
    const lines: string[] = [];

    lines.push(`GreenPulse Carbon Footprint Report`);
    lines.push(`Project,${this.escape(data.projectName)}`);
    lines.push(`Generated At,${data.generatedAt}`);
    lines.push(`Total CO2 (kg),${data.totalCO2.toFixed(4)}`);
    lines.push(`Total Events,${data.totalLogs}`);
    lines.push('');

    lines.push('Breakdown by Type');
    lines.push('Type,Total CO2 (kg),Event Count');
    for (const b of data.byType) {
      lines.push(`${b.type},${b.totalCO2.toFixed(4)},${b.count}`);
    }
    lines.push('');

    lines.push('Impact Events');
    lines.push('ID,Name,Description,Type,Unit Value,Carbon Score (kg),Created At');
    for (const log of data.impacts) {
      lines.push([
        log.id,
        this.escape(log.name),
        this.escape(log.description ?? ''),
        log.type,
        log.unitValue,
        log.carbonScore.toFixed(4),
        new Date(log.createdAt).toISOString(),
      ].join(','));
    }

    return lines.join('\n');
  }

  private escape(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
  }
}
