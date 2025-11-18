import { describe, it, expect } from 'vitest';
import { AnalyticsCalculator } from './analytics-calculator';

describe('AnalyticsCalculator', () => {
  describe('calculateParticipationRate', () => {
    it('should calculate participation rate correctly', () => {
      const rate = AnalyticsCalculator.calculateParticipationRate(45, 60);
      expect(rate).toBe(75); // 45/60 * 100 = 75%
    });

    it('should return 0 for zero total slots', () => {
      const rate = AnalyticsCalculator.calculateParticipationRate(10, 0);
      expect(rate).toBe(0);
    });

    it('should handle 100% participation', () => {
      const rate = AnalyticsCalculator.calculateParticipationRate(50, 50);
      expect(rate).toBe(100);
    });

    it('should round to 2 decimal places', () => {
      const rate = AnalyticsCalculator.calculateParticipationRate(1, 3);
      expect(rate).toBe(33.33);
    });
  });

  describe('calculateAverageScore', () => {
    it('should calculate average gross score', () => {
      const scores = [
        { totalGross: 78, totalNet: 72 },
        { totalGross: 82, totalNet: 76 },
        { totalGross: 85, totalNet: 79 },
      ];
      const avg = AnalyticsCalculator.calculateAverageScore(scores, 'gross');
      expect(avg).toBe(81.67);
    });

    it('should calculate average net score', () => {
      const scores = [
        { totalGross: 78, totalNet: 72 },
        { totalGross: 82, totalNet: 76 },
        { totalGross: 85, totalNet: 79 },
      ];
      const avg = AnalyticsCalculator.calculateAverageScore(scores, 'net');
      expect(avg).toBe(75.67);
    });

    it('should handle empty scores array', () => {
      const avg = AnalyticsCalculator.calculateAverageScore([], 'gross');
      expect(avg).toBe(0);
    });

    it('should ignore null scores', () => {
      const scores = [
        { totalGross: 78, totalNet: null },
        { totalGross: 82, totalNet: null },
        { totalGross: null, totalNet: 76 },
      ];
      const avgGross = AnalyticsCalculator.calculateAverageScore(scores, 'gross');
      const avgNet = AnalyticsCalculator.calculateAverageScore(scores, 'net');
      expect(avgGross).toBe(80); // (78 + 82) / 2
      expect(avgNet).toBe(76); // only one valid net score
    });
  });

  describe('calculateRevenue', () => {
    it('should calculate total revenue', () => {
      const registrations = [
        { paid: true, tournament: { entryFee: 50 } },
        { paid: true, tournament: { entryFee: 50 } },
        { paid: true, tournament: { entryFee: 75 } },
      ];
      const revenue = AnalyticsCalculator.calculateRevenue(registrations);
      expect(revenue).toBe(175);
    });

    it('should only count paid registrations', () => {
      const registrations = [
        { paid: true, tournament: { entryFee: 50 } },
        { paid: false, tournament: { entryFee: 50 } },
        { paid: true, tournament: { entryFee: 75 } },
      ];
      const revenue = AnalyticsCalculator.calculateRevenue(registrations);
      expect(revenue).toBe(125);
    });

    it('should handle null entry fees', () => {
      const registrations = [
        { paid: true, tournament: { entryFee: 50 } },
        { paid: true, tournament: { entryFee: null } },
        { paid: true, tournament: { entryFee: 75 } },
      ];
      const revenue = AnalyticsCalculator.calculateRevenue(registrations);
      expect(revenue).toBe(125);
    });

    it('should return 0 for empty registrations', () => {
      const revenue = AnalyticsCalculator.calculateRevenue([]);
      expect(revenue).toBe(0);
    });
  });

  describe('calculateRegistrationConversion', () => {
    it('should calculate conversion rate correctly', () => {
      const rate = AnalyticsCalculator.calculateRegistrationConversion(30, 100);
      expect(rate).toBe(30);
    });

    it('should return 0 for zero visitors', () => {
      const rate = AnalyticsCalculator.calculateRegistrationConversion(10, 0);
      expect(rate).toBe(0);
    });

    it('should handle 100% conversion', () => {
      const rate = AnalyticsCalculator.calculateRegistrationConversion(50, 50);
      expect(rate).toBe(100);
    });
  });

  describe('calculateHandicapDistribution', () => {
    it('should distribute players into handicap ranges', () => {
      const players = [
        { handicapIndex: 5.0 },
        { handicapIndex: 12.5 },
        { handicapIndex: 18.0 },
        { handicapIndex: 25.5 },
        { handicapIndex: 8.0 },
        { handicapIndex: 15.0 },
        { handicapIndex: 20.5 },
      ];

      const distribution = AnalyticsCalculator.calculateHandicapDistribution(players);

      expect(distribution).toEqual({
        '0-9': 2,    // 5.0, 8.0
        '10-18': 3,  // 12.5, 18.0, 15.0
        '19-27': 2,  // 25.5, 20.5
        '28-36': 0,
        '36+': 0,
      });
    });

    it('should handle edge cases at range boundaries', () => {
      const players = [
        { handicapIndex: 0 },
        { handicapIndex: 9.9 },
        { handicapIndex: 10.0 },
        { handicapIndex: 18.0 },
        { handicapIndex: 19.0 },
        { handicapIndex: 36.0 },
        { handicapIndex: 37.0 },
      ];

      const distribution = AnalyticsCalculator.calculateHandicapDistribution(players);

      expect(distribution).toEqual({
        '0-9': 2,    // 0, 9.9
        '10-18': 2,  // 10.0, 18.0
        '19-27': 1,  // 19.0
        '28-36': 1,  // 36.0
        '36+': 1,    // 37.0
      });
    });

    it('should handle empty players array', () => {
      const distribution = AnalyticsCalculator.calculateHandicapDistribution([]);

      expect(distribution).toEqual({
        '0-9': 0,
        '10-18': 0,
        '19-27': 0,
        '28-36': 0,
        '36+': 0,
      });
    });
  });

  describe('calculateAverageHandicap', () => {
    it('should calculate average handicap', () => {
      const players = [
        { handicapIndex: 10.0 },
        { handicapIndex: 15.5 },
        { handicapIndex: 20.0 },
      ];
      const avg = AnalyticsCalculator.calculateAverageHandicap(players);
      expect(avg).toBe(15.17);
    });

    it('should return 0 for empty players array', () => {
      const avg = AnalyticsCalculator.calculateAverageHandicap([]);
      expect(avg).toBe(0);
    });
  });

  describe('calculateCompletionRate', () => {
    it('should calculate scorecard completion rate', () => {
      const rate = AnalyticsCalculator.calculateCompletionRate(35, 50);
      expect(rate).toBe(70);
    });

    it('should return 0 for zero total scorecards', () => {
      const rate = AnalyticsCalculator.calculateCompletionRate(10, 0);
      expect(rate).toBe(0);
    });

    it('should handle 100% completion', () => {
      const rate = AnalyticsCalculator.calculateCompletionRate(40, 40);
      expect(rate).toBe(100);
    });
  });

  describe('calculateGrowthRate', () => {
    it('should calculate positive growth rate', () => {
      const rate = AnalyticsCalculator.calculateGrowthRate(120, 100);
      expect(rate).toBe(20); // 20% increase
    });

    it('should calculate negative growth rate', () => {
      const rate = AnalyticsCalculator.calculateGrowthRate(80, 100);
      expect(rate).toBe(-20); // 20% decrease
    });

    it('should return 0 for no change', () => {
      const rate = AnalyticsCalculator.calculateGrowthRate(100, 100);
      expect(rate).toBe(0);
    });

    it('should return 0 when previous value is zero', () => {
      const rate = AnalyticsCalculator.calculateGrowthRate(50, 0);
      expect(rate).toBe(0);
    });

    it('should handle decimal values', () => {
      const rate = AnalyticsCalculator.calculateGrowthRate(105, 100);
      expect(rate).toBe(5);
    });
  });

  describe('calculateTrend', () => {
    it('should identify upward trend', () => {
      const data = [100, 120, 150, 180, 200];
      const trend = AnalyticsCalculator.calculateTrend(data);
      expect(trend.direction).toBe('up');
      expect(trend.percentage).toBeGreaterThan(0);
    });

    it('should identify downward trend', () => {
      const data = [200, 180, 150, 120, 100];
      const trend = AnalyticsCalculator.calculateTrend(data);
      expect(trend.direction).toBe('down');
      expect(trend.percentage).toBeLessThan(0);
    });

    it('should identify stable trend', () => {
      const data = [100, 102, 99, 101, 100];
      const trend = AnalyticsCalculator.calculateTrend(data);
      expect(trend.direction).toBe('stable');
      expect(Math.abs(trend.percentage)).toBeLessThan(5);
    });

    it('should handle empty data', () => {
      const trend = AnalyticsCalculator.calculateTrend([]);
      expect(trend.direction).toBe('stable');
      expect(trend.percentage).toBe(0);
    });

    it('should handle single data point', () => {
      const trend = AnalyticsCalculator.calculateTrend([100]);
      expect(trend.direction).toBe('stable');
      expect(trend.percentage).toBe(0);
    });
  });
});
