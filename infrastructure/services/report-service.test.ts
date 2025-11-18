import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportService, ReportFormat } from './report-service';

describe('ReportService', () => {
  let service: ReportService;

  beforeEach(() => {
    service = new ReportService();
    vi.clearAllMocks();
  });

  describe('generateCSV', () => {
    it('should generate CSV from data array', async () => {
      const data = [
        { name: 'John Doe', score: 78, handicap: 12.5 },
        { name: 'Jane Smith', score: 82, handicap: 15.0 },
        { name: 'Bob Johnson', score: 85, handicap: 18.0 },
      ];

      const csv = await service.generateCSV(data);

      expect(csv).toContain('name,score,handicap');
      expect(csv).toContain('John Doe,78,12.5');
      expect(csv).toContain('Jane Smith,82,15');
      expect(csv).toContain('Bob Johnson,85,18');
    });

    it('should handle empty data', async () => {
      const csv = await service.generateCSV([]);
      expect(csv).toBe('');
    });

    it('should escape commas in values', async () => {
      const data = [{ name: 'Doe, John', company: 'Smith & Co.' }];
      const csv = await service.generateCSV(data);

      expect(csv).toContain('"Doe, John"');
    });
  });

  describe('generateExcel', () => {
    it('should generate Excel file from data', async () => {
      const data = [
        { name: 'John Doe', score: 78, handicap: 12.5 },
        { name: 'Jane Smith', score: 82, handicap: 15.0 },
      ];

      const buffer = await service.generateExcel(data, 'Tournament Results');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle empty data', async () => {
      const buffer = await service.generateExcel([], 'Empty Report');
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generatePDF', () => {
    it('should generate PDF with table data', async () => {
      const data = [
        { name: 'John Doe', score: 78, handicap: 12.5 },
        { name: 'Jane Smith', score: 82, handicap: 15.0 },
      ];

      const buffer = await service.generatePDF({
        title: 'Tournament Results',
        data,
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should include custom headers and footers', async () => {
      const buffer = await service.generatePDF({
        title: 'Custom Report',
        data: [],
        header: 'Golf Club Championship 2025',
        footer: 'Generated on ' + new Date().toDateString(),
      });

      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generateTournamentSummary', () => {
    it('should generate tournament summary in specified format', async () => {
      const tournamentData = {
        name: 'Club Championship 2025',
        date: new Date('2025-01-15'),
        totalPlayers: 45,
        averageScore: 78.5,
        winner: 'John Doe',
        winningScore: 72,
        revenue: 2250,
      };

      const csv = await service.generateTournamentSummary(tournamentData, ReportFormat.CSV);
      expect(csv).toBeInstanceOf(Buffer);

      const excel = await service.generateTournamentSummary(tournamentData, ReportFormat.EXCEL);
      expect(excel).toBeInstanceOf(Buffer);

      const pdf = await service.generateTournamentSummary(tournamentData, ReportFormat.PDF);
      expect(pdf).toBeInstanceOf(Buffer);
    });
  });

  describe('generatePlayerPerformanceReport', () => {
    it('should generate player performance report', async () => {
      const playerData = {
        name: 'John Doe',
        totalRounds: 12,
        averageScore: 78.5,
        bestScore: 72,
        handicap: 12.5,
        scoreHistory: [
          { date: new Date('2025-01-01'), score: 78 },
          { date: new Date('2025-01-15'), score: 75 },
          { date: new Date('2025-01-29'), score: 72 },
        ],
      };

      const pdf = await service.generatePlayerPerformanceReport(playerData, ReportFormat.PDF);
      expect(pdf).toBeInstanceOf(Buffer);
    });
  });

  describe('generateFinancialReport', () => {
    it('should generate financial report with revenue breakdown', async () => {
      const financialData = {
        period: 'January 2025',
        totalRevenue: 12500,
        totalTransactions: 250,
        averageTransactionValue: 50,
        revenueByTournament: [
          { tournament: 'Club Championship', revenue: 5000, participants: 100 },
          { tournament: 'Monthly Medal', revenue: 3750, participants: 75 },
          { tournament: 'Corporate Event', revenue: 3750, participants: 75 },
        ],
      };

      const excel = await service.generateFinancialReport(financialData, ReportFormat.EXCEL);
      expect(excel).toBeInstanceOf(Buffer);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency values correctly', () => {
      expect(service.formatCurrency(1234.56)).toBe('€1,234.56');
      expect(service.formatCurrency(0)).toBe('€0.00');
      expect(service.formatCurrency(999999.99)).toBe('€999,999.99');
    });
  });

  describe('formatDate', () => {
    it('should format dates consistently', () => {
      const date = new Date('2025-01-15T10:30:00Z');
      const formatted = service.formatDate(date);
      expect(formatted).toMatch(/2025/);
      expect(formatted).toMatch(/Jan|January/);
    });
  });
});
