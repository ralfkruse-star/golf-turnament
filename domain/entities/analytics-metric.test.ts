import { describe, it, expect } from 'vitest';
import { AnalyticsMetric, MetricType } from './analytics-metric';

describe('AnalyticsMetric', () => {
  describe('constructor', () => {
    it('should create a tournament participation metric', () => {
      const metric = new AnalyticsMetric({
        metricType: MetricType.TOURNAMENT_PARTICIPATION,
        date: new Date('2025-01-15'),
        value: 45,
        count: 45,
        tournamentId: 'tournament-123',
      });

      expect(metric.metricType).toBe(MetricType.TOURNAMENT_PARTICIPATION);
      expect(metric.value).toBe(45);
      expect(metric.count).toBe(45);
      expect(metric.tournamentId).toBe('tournament-123');
    });

    it('should create a player performance metric', () => {
      const metric = new AnalyticsMetric({
        metricType: MetricType.PLAYER_PERFORMANCE,
        date: new Date('2025-01-15'),
        value: 78.5,
        playerId: 'player-456',
        metadata: { averageScore: 78.5, roundsPlayed: 12 },
      });

      expect(metric.metricType).toBe(MetricType.PLAYER_PERFORMANCE);
      expect(metric.value).toBe(78.5);
      expect(metric.playerId).toBe('player-456');
      expect(metric.metadata).toEqual({ averageScore: 78.5, roundsPlayed: 12 });
    });

    it('should create a revenue metric', () => {
      const metric = new AnalyticsMetric({
        metricType: MetricType.REVENUE,
        date: new Date('2025-01-15'),
        value: 1250.50,
        count: 15,
        metadata: { tournamentId: 'tournament-123', currency: 'EUR' },
      });

      expect(metric.metricType).toBe(MetricType.REVENUE);
      expect(metric.value).toBe(1250.50);
      expect(metric.count).toBe(15);
    });

    it('should throw error for negative value', () => {
      expect(() => {
        new AnalyticsMetric({
          metricType: MetricType.REVENUE,
          date: new Date('2025-01-15'),
          value: -100,
        });
      }).toThrow('Metric value cannot be negative');
    });

    it('should throw error for negative count', () => {
      expect(() => {
        new AnalyticsMetric({
          metricType: MetricType.TOURNAMENT_PARTICIPATION,
          date: new Date('2025-01-15'),
          value: 10,
          count: -5,
        });
      }).toThrow('Count cannot be negative');
    });

    it('should throw error for future date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      expect(() => {
        new AnalyticsMetric({
          metricType: MetricType.REVENUE,
          date: futureDate,
          value: 100,
        });
      }).toThrow('Metric date cannot be in the future');
    });
  });

  describe('isValid', () => {
    it('should return true for valid metric', () => {
      const metric = new AnalyticsMetric({
        metricType: MetricType.REVENUE,
        date: new Date('2025-01-15'),
        value: 1250.50,
      });

      expect(metric.isValid()).toBe(true);
    });

    it('should return false for invalid metric type', () => {
      const metric = new AnalyticsMetric({
        metricType: MetricType.REVENUE,
        date: new Date('2025-01-15'),
        value: 1250.50,
      });

      // Manually set invalid type for testing
      (metric as any).metricType = 'INVALID_TYPE';
      expect(metric.isValid()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      const date = new Date('2025-01-15');
      const metric = new AnalyticsMetric({
        metricType: MetricType.REVENUE,
        date,
        value: 1250.50,
        count: 15,
        tournamentId: 'tournament-123',
        metadata: { currency: 'EUR' },
      });

      const json = metric.toJSON();

      expect(json).toEqual({
        metricType: MetricType.REVENUE,
        date: date.toISOString(),
        value: 1250.50,
        count: 15,
        tournamentId: 'tournament-123',
        playerId: undefined,
        metadata: { currency: 'EUR' },
      });
    });
  });

  describe('fromPrismaData', () => {
    it('should create metric from Prisma data', () => {
      const prismaData = {
        id: 'metric-789',
        metricType: 'REVENUE' as const,
        date: new Date('2025-01-15'),
        value: 1250.50,
        count: 15,
        tournamentId: 'tournament-123',
        playerId: null,
        metadata: { currency: 'EUR' },
        createdAt: new Date(),
      };

      const metric = AnalyticsMetric.fromPrismaData(prismaData);

      expect(metric.metricType).toBe(MetricType.REVENUE);
      expect(metric.value).toBe(1250.50);
      expect(metric.count).toBe(15);
      expect(metric.tournamentId).toBe('tournament-123');
    });
  });
});
