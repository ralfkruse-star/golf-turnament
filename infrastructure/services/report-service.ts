import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
  JSON = 'JSON',
}

export interface TournamentSummaryData {
  name: string;
  date: Date;
  totalPlayers: number;
  averageScore: number;
  winner?: string;
  winningScore?: number;
  revenue: number;
}

export interface PlayerPerformanceData {
  name: string;
  totalRounds: number;
  averageScore: number;
  bestScore: number;
  handicap: number;
  scoreHistory: Array<{ date: Date; score: number }>;
}

export interface FinancialData {
  period: string;
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  revenueByTournament: Array<{
    tournament: string;
    revenue: number;
    participants: number;
  }>;
}

export class ReportService {
  /**
   * Generate CSV from data array
   */
  async generateCSV(data: Record<string, any>[]): Promise<string> {
    if (data.length === 0) return '';

    // Get headers from first object
    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Generate Excel file from data
   */
  async generateExcel(data: Record<string, any>[], sheetName: string = 'Report'): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    if (data.length === 0) {
      return Buffer.from(await workbook.xlsx.writeBuffer());
    }

    // Add headers
    const headers = Object.keys(data[0]);
    worksheet.columns = headers.map((header) => ({
      header: header.charAt(0).toUpperCase() + header.slice(1),
      key: header,
      width: 15,
    }));

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add data
    data.forEach((item) => {
      worksheet.addRow(item);
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  /**
   * Generate PDF with table data
   */
  async generatePDF(options: {
    title: string;
    data: Record<string, any>[];
    header?: string;
    footer?: string;
  }): Promise<Buffer> {
    const doc = new jsPDF();

    // Add header if provided
    if (options.header) {
      doc.setFontSize(10);
      doc.text(options.header, 14, 15);
    }

    // Add title
    doc.setFontSize(18);
    doc.text(options.title, 14, options.header ? 25 : 15);

    // Prepare table data
    if (options.data.length > 0) {
      const headers = Object.keys(options.data[0]);
      const body = options.data.map((row) => headers.map((header) => row[header] ?? ''));

      autoTable(doc, {
        head: [headers],
        body: body,
        startY: options.header ? 35 : 25,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [71, 85, 105] },
      });
    }

    // Add footer if provided
    if (options.footer) {
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          options.footer,
          14,
          doc.internal.pageSize.getHeight() - 10
        );
      }
    }

    return Buffer.from(doc.output('arraybuffer'));
  }

  /**
   * Generate tournament summary report
   */
  async generateTournamentSummary(
    data: TournamentSummaryData,
    format: ReportFormat
  ): Promise<Buffer> {
    const reportData = [
      { field: 'Tournament Name', value: data.name },
      { field: 'Date', value: this.formatDate(data.date) },
      { field: 'Total Players', value: data.totalPlayers },
      { field: 'Average Score', value: data.averageScore.toFixed(1) },
      { field: 'Winner', value: data.winner || 'TBD' },
      { field: 'Winning Score', value: data.winningScore || 'TBD' },
      { field: 'Total Revenue', value: this.formatCurrency(data.revenue) },
    ];

    switch (format) {
      case ReportFormat.CSV:
        return Buffer.from(await this.generateCSV(reportData));
      case ReportFormat.EXCEL:
        return await this.generateExcel(reportData, 'Tournament Summary');
      case ReportFormat.PDF:
        return await this.generatePDF({
          title: 'Tournament Summary Report',
          data: reportData,
          header: `${data.name} - ${this.formatDate(data.date)}`,
          footer: `Generated on ${this.formatDate(new Date())}`,
        });
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Generate player performance report
   */
  async generatePlayerPerformanceReport(
    data: PlayerPerformanceData,
    format: ReportFormat
  ): Promise<Buffer> {
    const summary = [
      { field: 'Player Name', value: data.name },
      { field: 'Total Rounds', value: data.totalRounds },
      { field: 'Average Score', value: data.averageScore.toFixed(1) },
      { field: 'Best Score', value: data.bestScore },
      { field: 'Current Handicap', value: data.handicap.toFixed(1) },
    ];

    const scoreHistory = data.scoreHistory.map((s) => ({
      date: this.formatDate(s.date),
      score: s.score,
    }));

    switch (format) {
      case ReportFormat.CSV:
        return Buffer.from(await this.generateCSV([...summary, ...scoreHistory]));
      case ReportFormat.EXCEL: {
        const workbook = new ExcelJS.Workbook();

        // Summary sheet
        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.columns = [
          { header: 'Field', key: 'field', width: 20 },
          { header: 'Value', key: 'value', width: 20 },
        ];
        summarySheet.getRow(1).font = { bold: true };
        summary.forEach((item) => summarySheet.addRow(item));

        // Score History sheet
        const historySheet = workbook.addWorksheet('Score History');
        historySheet.columns = [
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Score', key: 'score', width: 10 },
        ];
        historySheet.getRow(1).font = { bold: true };
        scoreHistory.forEach((item) => historySheet.addRow(item));

        return Buffer.from(await workbook.xlsx.writeBuffer());
      }
      case ReportFormat.PDF: {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Player Performance Report', 14, 15);

        doc.setFontSize(14);
        doc.text(data.name, 14, 25);

        // Summary table
        autoTable(doc, {
          head: [['Field', 'Value']],
          body: summary.map((s) => [s.field, String(s.value)]),
          startY: 35,
          headStyles: { fillColor: [71, 85, 105] },
        });

        // Score history table
        const finalY = (doc as any).lastAutoTable.finalY || 35;
        autoTable(doc, {
          head: [['Date', 'Score']],
          body: scoreHistory.map((s) => [s.date, String(s.score)]),
          startY: finalY + 10,
          headStyles: { fillColor: [71, 85, 105] },
        });

        return Buffer.from(doc.output('arraybuffer'));
      }
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Generate financial report
   */
  async generateFinancialReport(
    data: FinancialData,
    format: ReportFormat
  ): Promise<Buffer> {
    const summary = [
      { field: 'Period', value: data.period },
      { field: 'Total Revenue', value: this.formatCurrency(data.totalRevenue) },
      { field: 'Total Transactions', value: data.totalTransactions },
      {
        field: 'Avg Transaction Value',
        value: this.formatCurrency(data.averageTransactionValue),
      },
    ];

    const revenueBreakdown = data.revenueByTournament.map((t) => ({
      tournament: t.tournament,
      revenue: this.formatCurrency(t.revenue),
      participants: t.participants,
      avgPerPlayer: this.formatCurrency(t.revenue / t.participants),
    }));

    switch (format) {
      case ReportFormat.CSV:
        return Buffer.from(await this.generateCSV([...summary, ...revenueBreakdown]));
      case ReportFormat.EXCEL: {
        const workbook = new ExcelJS.Workbook();

        // Summary sheet
        const summarySheet = workbook.addWorksheet('Financial Summary');
        summarySheet.columns = [
          { header: 'Field', key: 'field', width: 25 },
          { header: 'Value', key: 'value', width: 20 },
        ];
        summarySheet.getRow(1).font = { bold: true };
        summarySheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' },
        };
        summary.forEach((item) => summarySheet.addRow(item));

        // Revenue breakdown sheet
        const breakdownSheet = workbook.addWorksheet('Revenue by Tournament');
        breakdownSheet.columns = [
          { header: 'Tournament', key: 'tournament', width: 25 },
          { header: 'Revenue', key: 'revenue', width: 15 },
          { header: 'Participants', key: 'participants', width: 15 },
          { header: 'Avg Per Player', key: 'avgPerPlayer', width: 15 },
        ];
        breakdownSheet.getRow(1).font = { bold: true };
        breakdownSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' },
        };
        revenueBreakdown.forEach((item) => breakdownSheet.addRow(item));

        return Buffer.from(await workbook.xlsx.writeBuffer());
      }
      case ReportFormat.PDF: {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Financial Report', 14, 15);

        doc.setFontSize(14);
        doc.text(data.period, 14, 25);

        // Summary table
        autoTable(doc, {
          head: [['Field', 'Value']],
          body: summary.map((s) => [s.field, String(s.value)]),
          startY: 35,
          headStyles: { fillColor: [71, 85, 105] },
        });

        // Revenue breakdown table
        const finalY = (doc as any).lastAutoTable.finalY || 35;
        autoTable(doc, {
          head: [['Tournament', 'Revenue', 'Participants', 'Avg Per Player']],
          body: revenueBreakdown.map((r) => [
            r.tournament,
            r.revenue,
            String(r.participants),
            r.avgPerPlayer,
          ]),
          startY: finalY + 10,
          headStyles: { fillColor: [71, 85, 105] },
        });

        return Buffer.from(doc.output('arraybuffer'));
      }
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Format currency value
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  }

  /**
   * Format date consistently
   */
  formatDate(date: Date): string {
    return format(date, 'MMM dd, yyyy');
  }
}
