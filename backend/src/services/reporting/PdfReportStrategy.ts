import PDFDocument from 'pdfkit';
import { IReportStrategy, ReportData } from './IReportStrategy';

/**
 * PdfReportStrategy — Strategy Pattern implementation.
 * Generates a formatted PDF file from ReportData.
 */
export class PdfReportStrategy implements IReportStrategy {
  contentType = 'application/pdf';
  fileExtension = 'pdf';

  generate(data: ReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', (buffer) => buffers.push(buffer));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        doc.fontSize(20).text('GreenPulse Carbon Footprint Report', { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(12).text(`Project: ${data.projectName}`);
        doc.text(`Generated At: ${data.generatedAt}`);
        doc.text(`Total Events: ${data.totalLogs}`);
        doc.moveDown();

        doc.fontSize(16).fillColor('#16a34a').text(`Total CO2: ${data.totalCO2.toFixed(4)} kg`, { align: 'center' });
        doc.fillColor('black');
        doc.moveDown(2);
        doc.fontSize(14).text('Breakdown by Type');
        doc.moveDown(0.5);
        
        for (const b of data.byType) {
          doc.fontSize(12).text(`• ${b.type}: ${b.totalCO2.toFixed(4)} kg (${b.count} events)`);
        }
        doc.moveDown(2);

        doc.fontSize(14).text('Impact Events');
        doc.moveDown(0.5);

        for (const log of data.impacts) {
          doc.fontSize(10).text(
            `ID: ${log.id} | Name: ${log.name} | Type: ${log.type} | Value: ${log.unitValue} | CO2: ${log.carbonScore.toFixed(4)} kg`
          );
          doc.moveDown(0.5);
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
