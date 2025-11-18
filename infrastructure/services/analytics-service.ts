import { PrismaClient, MetricType as PrismaMetricType } from '@prisma/client';
import { AnalyticsCalculator } from '@/domain/services/analytics-calculator';
import { format } from 'date-fns';

export interface TournamentMetrics {
  tournamentId: string;
  totalRegistrations: number;
  participationRate: number;
  totalRevenue: number;
  averageGrossScore: number;
  averageNetScore: number;
  averageStablefordPoints: number;
  completionRate: number;
}

export interface PlayerPerformance {
  playerId: string;
  totalRounds: number;
  totalTournaments: number;
  averageGrossScore: number;
  averageNetScore: number;
  averageStablefordPoints: number;
  bestGrossScore: number;
  bestNetScore: number;
  currentHandicap: number;
  scoreHistory: Array<{
    date: Date;
    grossScore: number;
    netScore: number;
    points?: number;
  }>;
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
}

export interface RevenueMetrics {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  periodStart: string;
  periodEnd: string;
  revenueByDate: Array<{ date: string; amount: number; count: number }>;
}

export interface ParticipationTrends {
  periodStart: string;
  periodEnd: string;
  totalTournaments: number;
  averageParticipation: number;
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
  dataPoints: Array<{
    date: string;
    participants: number;
    capacity: number;
    rate: number;
  }>;
}

export interface HandicapDistribution {
  totalPlayers: number;
  averageHandicap: number;
  distribution: Record<string, number>;
}

export interface DashboardMetrics {
  totalTournaments: number;
  upcomingTournaments: number;
  completedTournaments: number;
  totalPlayers: number;
  totalRevenue: number;
  averageScore: number;
  recentTrend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
}

export class AnalyticsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Calculate comprehensive metrics for a specific tournament
   */
  async calculateTournamentMetrics(tournamentId: string): Promise<TournamentMetrics> {
    // Fetch tournament
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Fetch registrations
    const registrations = await this.prisma.registration.findMany({
      where: { tournamentId },
      include: {
        tournament: {
          select: { entryFee: true },
        },
      },
    });

    const totalRegistrations = await this.prisma.registration.count({
      where: { tournamentId },
    });

    // Calculate participation rate
    const participationRate = AnalyticsCalculator.calculateParticipationRate(
      totalRegistrations,
      tournament.maxPlayers || totalRegistrations
    );

    // Calculate revenue
    const totalRevenue = AnalyticsCalculator.calculateRevenue(
      registrations.map((r) => ({
        paid: r.paid,
        tournament: { entryFee: r.tournament.entryFee ? Number(r.tournament.entryFee) : null },
      }))
    );

    // Fetch scorecards
    const scorecards = await this.prisma.scorecard.findMany({
      where: {
        tournamentId,
        status: { in: ['SUBMITTED', 'VERIFIED'] },
      },
    });

    // Calculate average scores
    const scoreData = scorecards.map((s) => ({
      totalGross: s.totalGross,
      totalNet: s.totalNet,
      totalPoints: s.totalPoints,
    }));

    const averageGrossScore = AnalyticsCalculator.calculateAverageScore(scoreData, 'gross');
    const averageNetScore = AnalyticsCalculator.calculateAverageScore(scoreData, 'net');
    const averageStablefordPoints = AnalyticsCalculator.calculateAverageScore(scoreData, 'points');

    // Calculate completion rate
    const completedScorecards = await this.prisma.scorecard.count({
      where: {
        tournamentId,
        status: { in: ['SUBMITTED', 'VERIFIED'] },
      },
    });

    const totalScorecards = await this.prisma.scorecard.count({
      where: { tournamentId },
    });

    const completionRate = AnalyticsCalculator.calculateCompletionRate(
      completedScorecards,
      totalScorecards
    );

    return {
      tournamentId,
      totalRegistrations,
      participationRate,
      totalRevenue,
      averageGrossScore,
      averageNetScore,
      averageStablefordPoints,
      completionRate,
    };
  }

  /**
   * Calculate player performance metrics over time
   */
  async calculatePlayerPerformance(playerId: string): Promise<PlayerPerformance> {
    // Fetch player
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    // Fetch all scorecards for the player
    const scorecards = await this.prisma.scorecard.findMany({
      where: {
        playerId,
        status: { in: ['SUBMITTED', 'VERIFIED'] },
      },
      include: {
        tournament: {
          select: { tournamentDate: true },
        },
      },
      orderBy: {
        tournament: { tournamentDate: 'asc' },
      },
    });

    // Calculate statistics
    const scoreData = scorecards.map((s) => ({
      totalGross: s.totalGross,
      totalNet: s.totalNet,
      totalPoints: s.totalPoints,
    }));

    const averageGrossScore = AnalyticsCalculator.calculateAverageScore(scoreData, 'gross');
    const averageNetScore = AnalyticsCalculator.calculateAverageScore(scoreData, 'net');
    const averageStablefordPoints = AnalyticsCalculator.calculateAverageScore(scoreData, 'points');

    // Find best scores
    const validGrossScores = scorecards
      .map((s) => s.totalGross)
      .filter((s): s is number => s !== null);
    const validNetScores = scorecards.map((s) => s.totalNet).filter((s): s is number => s !== null);

    const bestGrossScore = validGrossScores.length > 0 ? Math.min(...validGrossScores) : 0;
    const bestNetScore = validNetScores.length > 0 ? Math.min(...validNetScores) : 0;

    // Build score history
    const scoreHistory = scorecards.map((s) => ({
      date: s.tournament.tournamentDate,
      grossScore: s.totalGross || 0,
      netScore: s.totalNet || 0,
      points: s.totalPoints || undefined,
    }));

    // Calculate trend
    const netScores = validNetScores.length > 0 ? validNetScores : validGrossScores;
    const trend = AnalyticsCalculator.calculateTrend(netScores);

    // Total tournaments registered
    const totalTournaments = await this.prisma.registration.count({
      where: { playerId },
    });

    return {
      playerId,
      totalRounds: scorecards.length,
      totalTournaments,
      averageGrossScore,
      averageNetScore,
      averageStablefordPoints,
      bestGrossScore,
      bestNetScore,
      currentHandicap: Number(player.handicapIndex),
      scoreHistory,
      trend,
    };
  }

  /**
   * Calculate revenue metrics for a date range
   */
  async calculateRevenueMetrics(startDate: Date, endDate: Date): Promise<RevenueMetrics> {
    const registrations = await this.prisma.registration.findMany({
      where: {
        paid: true,
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        tournament: {
          select: { entryFee: true, tournamentDate: true },
        },
      },
      orderBy: {
        paidAt: 'asc',
      },
    });

    // Calculate total revenue
    const totalRevenue = AnalyticsCalculator.calculateRevenue(
      registrations.map((r) => ({
        paid: r.paid,
        tournament: { entryFee: r.tournament.entryFee ? Number(r.tournament.entryFee) : null },
      }))
    );

    const totalTransactions = registrations.length;
    const averageTransactionValue =
      totalTransactions > 0 ? Math.round((totalRevenue / totalTransactions) * 100) / 100 : 0;

    // Group revenue by date
    const revenueByDateMap = new Map<string, { amount: number; count: number }>();

    registrations.forEach((reg) => {
      const dateKey = format(reg.paidAt || new Date(), 'yyyy-MM-dd');
      const amount = reg.tournament.entryFee ? Number(reg.tournament.entryFee) : 0;

      if (revenueByDateMap.has(dateKey)) {
        const current = revenueByDateMap.get(dateKey)!;
        revenueByDateMap.set(dateKey, {
          amount: current.amount + amount,
          count: current.count + 1,
        });
      } else {
        revenueByDateMap.set(dateKey, { amount, count: 1 });
      }
    });

    const revenueByDate = Array.from(revenueByDateMap.entries()).map(([date, data]) => ({
      date,
      amount: data.amount,
      count: data.count,
    }));

    return {
      totalRevenue,
      totalTransactions,
      averageTransactionValue,
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
      revenueByDate,
    };
  }

  /**
   * Get participation trends over time
   */
  async getParticipationTrends(startDate: Date, endDate: Date): Promise<ParticipationTrends> {
    const tournaments = await this.prisma.tournament.findMany({
      where: {
        tournamentDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['COMPLETED', 'IN_PROGRESS'] },
      },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: {
        tournamentDate: 'asc',
      },
    });

    const dataPoints = tournaments.map((t) => ({
      date: format(t.tournamentDate, 'yyyy-MM-dd'),
      participants: t._count.registrations,
      capacity: t.maxPlayers || t._count.registrations,
      rate: AnalyticsCalculator.calculateParticipationRate(
        t._count.registrations,
        t.maxPlayers || t._count.registrations
      ),
    }));

    const participantCounts = dataPoints.map((d) => d.participants);
    const averageParticipation =
      participantCounts.length > 0
        ? Math.round(
            participantCounts.reduce((sum, count) => sum + count, 0) / participantCounts.length
          )
        : 0;

    const trend = AnalyticsCalculator.calculateTrend(participantCounts);

    return {
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
      totalTournaments: tournaments.length,
      averageParticipation,
      trend,
      dataPoints,
    };
  }

  /**
   * Get handicap distribution across all active players
   */
  async getHandicapDistribution(): Promise<HandicapDistribution> {
    const players = await this.prisma.player.findMany({
      select: { handicapIndex: true },
    });

    const playerData = players.map((p) => ({
      handicapIndex: Number(p.handicapIndex),
    }));

    const distribution = AnalyticsCalculator.calculateHandicapDistribution(playerData);
    const averageHandicap = AnalyticsCalculator.calculateAverageHandicap(playerData);

    return {
      totalPlayers: players.length,
      averageHandicap,
      distribution,
    };
  }

  /**
   * Get dashboard overview metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get tournament counts
    const totalTournaments = await this.prisma.tournament.count();
    const upcomingTournaments = await this.prisma.tournament.count({
      where: {
        tournamentDate: { gte: now },
        status: { in: ['OPEN_FOR_REGISTRATION', 'REGISTRATION_CLOSED'] },
      },
    });
    const completedTournaments = await this.prisma.tournament.count({
      where: { status: 'COMPLETED' },
    });

    // Get player count
    const totalPlayers = await this.prisma.player.count();

    // Calculate total revenue (last 30 days)
    const recentRegistrations = await this.prisma.registration.findMany({
      where: {
        paid: true,
        paidAt: { gte: thirtyDaysAgo },
      },
      include: {
        tournament: {
          select: { entryFee: true },
        },
      },
    });

    const totalRevenue = AnalyticsCalculator.calculateRevenue(
      recentRegistrations.map((r) => ({
        paid: r.paid,
        tournament: { entryFee: r.tournament.entryFee ? Number(r.tournament.entryFee) : null },
      }))
    );

    // Calculate average score (last 30 days)
    const recentScorecards = await this.prisma.scorecard.findMany({
      where: {
        status: { in: ['SUBMITTED', 'VERIFIED'] },
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const scoreData = recentScorecards.map((s) => ({
      totalGross: s.totalGross,
      totalNet: s.totalNet,
      totalPoints: s.totalPoints,
    }));

    const averageScore = AnalyticsCalculator.calculateAverageScore(scoreData, 'net');

    return {
      totalTournaments,
      upcomingTournaments,
      completedTournaments,
      totalPlayers,
      totalRevenue,
      averageScore,
    };
  }

  /**
   * Store a calculated metric in the database for caching
   */
  async storeMetric(data: {
    metricType: PrismaMetricType;
    date: Date;
    value: number;
    count?: number;
    tournamentId?: string;
    playerId?: string;
    metadata?: any;
  }) {
    return this.prisma.analyticsMetric.create({
      data,
    });
  }

  /**
   * Retrieve cached metrics
   */
  async getMetrics(filters: {
    metricType?: PrismaMetricType;
    startDate?: Date;
    endDate?: Date;
    tournamentId?: string;
    playerId?: string;
  }) {
    return this.prisma.analyticsMetric.findMany({
      where: {
        metricType: filters.metricType,
        date: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
        tournamentId: filters.tournamentId,
        playerId: filters.playerId,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }
}
