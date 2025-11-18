/**
 * Analytics Calculator Service
 * Pure functions for calculating various analytics metrics
 */

export interface ScoreData {
  totalGross: number | null;
  totalNet: number | null;
  totalPoints?: number | null;
}

export interface RegistrationData {
  paid: boolean;
  tournament: {
    entryFee: number | null;
  };
}

export interface PlayerData {
  handicapIndex: number;
}

export interface TrendResult {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
}

export class AnalyticsCalculator {
  /**
   * Calculate participation rate as a percentage
   */
  static calculateParticipationRate(registered: number, totalSlots: number): number {
    if (totalSlots === 0) return 0;
    return Math.round((registered / totalSlots) * 100 * 100) / 100;
  }

  /**
   * Calculate average score from an array of scorecards
   */
  static calculateAverageScore(
    scores: ScoreData[],
    type: 'gross' | 'net' | 'points'
  ): number {
    const field = type === 'gross' ? 'totalGross' : type === 'net' ? 'totalNet' : 'totalPoints';
    const validScores = scores
      .map((s) => s[field])
      .filter((score): score is number => score !== null && score !== undefined);

    if (validScores.length === 0) return 0;

    const sum = validScores.reduce((acc, score) => acc + score, 0);
    return Math.round((sum / validScores.length) * 100) / 100;
  }

  /**
   * Calculate total revenue from registrations
   */
  static calculateRevenue(registrations: RegistrationData[]): number {
    return registrations
      .filter((r) => r.paid && r.tournament.entryFee !== null)
      .reduce((sum, r) => sum + (r.tournament.entryFee || 0), 0);
  }

  /**
   * Calculate registration conversion rate
   */
  static calculateRegistrationConversion(registered: number, visitors: number): number {
    if (visitors === 0) return 0;
    return Math.round((registered / visitors) * 100 * 100) / 100;
  }

  /**
   * Calculate handicap distribution across standard ranges
   */
  static calculateHandicapDistribution(players: PlayerData[]): Record<string, number> {
    const ranges = {
      '0-9': 0,
      '10-18': 0,
      '19-27': 0,
      '28-36': 0,
      '36+': 0,
    };

    players.forEach((player) => {
      const hcp = player.handicapIndex;
      if (hcp < 10) {
        ranges['0-9']++;
      } else if (hcp < 19) {
        ranges['10-18']++;
      } else if (hcp < 28) {
        ranges['19-27']++;
      } else if (hcp <= 36) {
        ranges['28-36']++;
      } else {
        ranges['36+']++;
      }
    });

    return ranges;
  }

  /**
   * Calculate average handicap
   */
  static calculateAverageHandicap(players: PlayerData[]): number {
    if (players.length === 0) return 0;

    const sum = players.reduce((acc, p) => acc + p.handicapIndex, 0);
    return Math.round((sum / players.length) * 100) / 100;
  }

  /**
   * Calculate completion rate (e.g., scorecards submitted vs started)
   */
  static calculateCompletionRate(completed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100 * 100) / 100;
  }

  /**
   * Calculate growth rate between two values
   */
  static calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return 0;
    const growth = ((current - previous) / previous) * 100;
    return Math.round(growth * 100) / 100;
  }

  /**
   * Calculate trend from time series data
   * Returns direction and percentage change
   */
  static calculateTrend(data: number[]): TrendResult {
    if (data.length === 0 || data.length === 1) {
      return { direction: 'stable', percentage: 0 };
    }

    // Simple linear trend: compare first and last values
    const first = data[0];
    const last = data[data.length - 1];
    const percentage = this.calculateGrowthRate(last, first);

    // Consider stable if change is less than 5%
    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (percentage > 5) {
      direction = 'up';
    } else if (percentage < -5) {
      direction = 'down';
    }

    return { direction, percentage };
  }

  /**
   * Calculate percentile rank for a score
   */
  static calculatePercentile(score: number, allScores: number[]): number {
    if (allScores.length === 0) return 0;

    const sorted = [...allScores].sort((a, b) => a - b);
    const belowOrEqual = sorted.filter((s) => s <= score).length;

    return Math.round((belowOrEqual / sorted.length) * 100);
  }

  /**
   * Calculate standard deviation
   */
  static calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;

    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map((val) => Math.pow(val - avg, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;

    return Math.round(Math.sqrt(variance) * 100) / 100;
  }
}
