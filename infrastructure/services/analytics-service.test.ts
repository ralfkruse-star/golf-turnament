import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsService } from './analytics-service';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    tournament: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    registration: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    player: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    scorecard: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    analyticsMetric: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  })),
}));

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    service = new AnalyticsService(mockPrisma);
    vi.clearAllMocks();
  });

  describe('calculateTournamentMetrics', () => {
    it('should calculate comprehensive tournament metrics', async () => {
      const tournamentId = 'tournament-123';

      // Mock tournament data
      mockPrisma.tournament.findUnique.mockResolvedValue({
        id: tournamentId,
        name: 'Club Championship',
        maxPlayers: 60,
        entryFee: 50,
        status: 'COMPLETED',
      });

      // Mock registrations
      mockPrisma.registration.findMany.mockResolvedValue([
        { paid: true, status: 'CONFIRMED' },
        { paid: true, status: 'CONFIRMED' },
        { paid: false, status: 'PENDING' },
      ]);

      mockPrisma.registration.count.mockResolvedValue(3);

      // Mock scorecards
      mockPrisma.scorecard.findMany.mockResolvedValue([
        { totalGross: 78, totalNet: 72, totalPoints: 36, status: 'VERIFIED' },
        { totalGross: 82, totalNet: 76, totalPoints: 34, status: 'VERIFIED' },
      ]);

      mockPrisma.scorecard.count
        .mockResolvedValueOnce(2) // completed
        .mockResolvedValueOnce(3); // total

      const metrics = await service.calculateTournamentMetrics(tournamentId);

      expect(metrics).toMatchObject({
        tournamentId,
        totalRegistrations: 3,
        participationRate: expect.any(Number),
        totalRevenue: 100, // 2 paid registrations * 50
        averageGrossScore: 80,
        averageNetScore: 74,
        averageStablefordPoints: 35,
        completionRate: expect.any(Number),
      });
    });

    it('should throw error if tournament not found', async () => {
      mockPrisma.tournament.findUnique.mockResolvedValue(null);

      await expect(service.calculateTournamentMetrics('invalid-id')).rejects.toThrow(
        'Tournament not found'
      );
    });
  });

  describe('calculatePlayerPerformance', () => {
    it('should calculate player performance metrics over time', async () => {
      const playerId = 'player-456';

      // Mock player data
      mockPrisma.player.findUnique.mockResolvedValue({
        id: playerId,
        firstName: 'John',
        lastName: 'Doe',
        handicapIndex: 15.5,
      });

      // Mock scorecards
      mockPrisma.scorecard.findMany.mockResolvedValue([
        {
          totalGross: 78,
          totalNet: 72,
          totalPoints: 36,
          status: 'VERIFIED',
          tournament: { tournamentDate: new Date('2025-01-15') },
        },
        {
          totalGross: 82,
          totalNet: 76,
          totalPoints: 34,
          status: 'VERIFIED',
          tournament: { tournamentDate: new Date('2025-01-22') },
        },
        {
          totalGross: 75,
          totalNet: 69,
          totalPoints: 38,
          status: 'VERIFIED',
          tournament: { tournamentDate: new Date('2025-01-29') },
        },
      ]);

      mockPrisma.registration.count.mockResolvedValue(5);

      const performance = await service.calculatePlayerPerformance(playerId);

      expect(performance).toMatchObject({
        playerId,
        totalRounds: 3,
        totalTournaments: 5,
        averageGrossScore: 78.33,
        averageNetScore: 72.33,
        averageStablefordPoints: 36,
        bestGrossScore: 75,
        bestNetScore: 69,
        currentHandicap: 15.5,
      });

      expect(performance.scoreHistory).toHaveLength(3);
      expect(performance.trend.direction).toBeDefined();
    });

    it('should throw error if player not found', async () => {
      mockPrisma.player.findUnique.mockResolvedValue(null);

      await expect(service.calculatePlayerPerformance('invalid-id')).rejects.toThrow(
        'Player not found'
      );
    });
  });

  describe('calculateRevenueMetrics', () => {
    it('should calculate revenue metrics for date range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      mockPrisma.registration.findMany.mockResolvedValue([
        {
          paid: true,
          paidAt: new Date('2025-01-05'),
          tournament: { entryFee: 50, tournamentDate: new Date('2025-01-10') },
        },
        {
          paid: true,
          paidAt: new Date('2025-01-15'),
          tournament: { entryFee: 75, tournamentDate: new Date('2025-01-20') },
        },
        {
          paid: true,
          paidAt: new Date('2025-01-25'),
          tournament: { entryFee: 50, tournamentDate: new Date('2025-01-28') },
        },
      ]);

      const revenue = await service.calculateRevenueMetrics(startDate, endDate);

      expect(revenue).toMatchObject({
        totalRevenue: 175,
        totalTransactions: 3,
        averageTransactionValue: 58.33,
        periodStart: startDate.toISOString(),
        periodEnd: endDate.toISOString(),
      });

      expect(revenue.revenueByDate).toBeDefined();
    });

    it('should handle zero revenue', async () => {
      mockPrisma.registration.findMany.mockResolvedValue([]);

      const revenue = await service.calculateRevenueMetrics(
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );

      expect(revenue.totalRevenue).toBe(0);
      expect(revenue.totalTransactions).toBe(0);
    });
  });

  describe('getParticipationTrends', () => {
    it('should calculate participation trends over time', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-03-31');

      mockPrisma.tournament.findMany.mockResolvedValue([
        {
          id: 't1',
          tournamentDate: new Date('2025-01-15'),
          maxPlayers: 60,
          _count: { registrations: 45 },
        },
        {
          id: 't2',
          tournamentDate: new Date('2025-02-15'),
          maxPlayers: 60,
          _count: { registrations: 50 },
        },
        {
          id: 't3',
          tournamentDate: new Date('2025-03-15'),
          maxPlayers: 60,
          _count: { registrations: 55 },
        },
      ]);

      const trends = await service.getParticipationTrends(startDate, endDate);

      expect(trends).toMatchObject({
        periodStart: startDate.toISOString(),
        periodEnd: endDate.toISOString(),
        totalTournaments: 3,
        averageParticipation: 50,
        trend: {
          direction: 'up',
          percentage: expect.any(Number),
        },
      });

      expect(trends.dataPoints).toHaveLength(3);
    });
  });

  describe('getHandicapDistribution', () => {
    it('should calculate current handicap distribution', async () => {
      mockPrisma.player.findMany.mockResolvedValue([
        { handicapIndex: 5.0 },
        { handicapIndex: 12.5 },
        { handicapIndex: 18.0 },
        { handicapIndex: 25.5 },
        { handicapIndex: 8.0 },
      ]);

      const distribution = await service.getHandicapDistribution();

      expect(distribution).toMatchObject({
        totalPlayers: 5,
        averageHandicap: expect.any(Number),
        distribution: {
          '0-9': 2,
          '10-18': 2,
          '19-27': 1,
          '28-36': 0,
          '36+': 0,
        },
      });
    });
  });

  describe('getDashboardMetrics', () => {
    it('should fetch comprehensive dashboard metrics', async () => {
      // Mock various counts
      mockPrisma.tournament.count
        .mockResolvedValueOnce(25) // total
        .mockResolvedValueOnce(3) // upcoming
        .mockResolvedValueOnce(20); // completed

      mockPrisma.player.count.mockResolvedValue(150);

      mockPrisma.registration.findMany.mockResolvedValue([
        {
          paid: true,
          paidAt: new Date('2025-01-15'),
          tournament: { entryFee: 50 },
        },
        {
          paid: true,
          paidAt: new Date('2025-01-20'),
          tournament: { entryFee: 75 },
        },
      ]);

      mockPrisma.scorecard.findMany.mockResolvedValue([
        { totalGross: 78, totalNet: 72 },
        { totalGross: 82, totalNet: 76 },
      ]);

      const metrics = await service.getDashboardMetrics();

      expect(metrics).toMatchObject({
        totalTournaments: 25,
        upcomingTournaments: 3,
        completedTournaments: 20,
        totalPlayers: 150,
        totalRevenue: 125,
        averageScore: expect.any(Number),
      });
    });
  });

  describe('storeMetric', () => {
    it('should store analytics metric in database', async () => {
      const metricData = {
        metricType: 'REVENUE' as const,
        date: new Date('2025-01-15'),
        value: 1250.50,
        count: 15,
        tournamentId: 'tournament-123',
        metadata: { currency: 'EUR' },
      };

      mockPrisma.analyticsMetric.create.mockResolvedValue({
        id: 'metric-123',
        ...metricData,
        createdAt: new Date(),
      });

      const result = await service.storeMetric(metricData);

      expect(mockPrisma.analyticsMetric.create).toHaveBeenCalledWith({
        data: metricData,
      });

      expect(result).toHaveProperty('id', 'metric-123');
    });
  });
});
