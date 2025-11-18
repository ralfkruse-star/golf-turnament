import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ReportService, ReportFormat } from '@/infrastructure/services/report-service';
import { AnalyticsService } from '@/infrastructure/services/analytics-service';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportType, format, parameters } = body;

    // Validate input
    if (!reportType || !format) {
      return NextResponse.json(
        { error: 'reportType and format are required' },
        { status: 400 }
      );
    }

    const reportService = new ReportService();
    const analyticsService = new AnalyticsService(prisma);
    let reportBuffer: Buffer;
    let reportTitle = 'Report';

    // Generate report based on type
    switch (reportType) {
      case 'TOURNAMENT_SUMMARY': {
        if (!parameters.tournamentId) {
          return NextResponse.json(
            { error: 'tournamentId is required' },
            { status: 400 }
          );
        }

        const metrics = await analyticsService.calculateTournamentMetrics(
          parameters.tournamentId
        );
        const tournament = await prisma.tournament.findUnique({
          where: { id: parameters.tournamentId },
        });

        reportBuffer = await reportService.generateTournamentSummary(
          {
            name: tournament?.name || 'Tournament',
            date: tournament?.tournamentDate || new Date(),
            totalPlayers: metrics.totalRegistrations,
            averageScore: metrics.averageGrossScore,
            revenue: metrics.totalRevenue,
          },
          format as ReportFormat
        );
        reportTitle = `Tournament_${tournament?.name}_Summary`;
        break;
      }

      case 'PLAYER_PERFORMANCE': {
        if (!parameters.playerId) {
          return NextResponse.json({ error: 'playerId is required' }, { status: 400 });
        }

        const performance = await analyticsService.calculatePlayerPerformance(
          parameters.playerId
        );
        const player = await prisma.player.findUnique({
          where: { id: parameters.playerId },
        });

        reportBuffer = await reportService.generatePlayerPerformanceReport(
          {
            name: player ? `${player.firstName} ${player.lastName}` : 'Player',
            totalRounds: performance.totalRounds,
            averageScore: performance.averageNetScore,
            bestScore: performance.bestNetScore,
            handicap: performance.currentHandicap,
            scoreHistory: performance.scoreHistory.map((s) => ({
              date: s.date,
              score: s.netScore,
            })),
          },
          format as ReportFormat
        );
        reportTitle = `Player_${player?.lastName}_Performance`;
        break;
      }

      case 'FINANCIAL': {
        const startDate = parameters.startDate
          ? new Date(parameters.startDate)
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = parameters.endDate ? new Date(parameters.endDate) : new Date();

        const metrics = await analyticsService.calculateRevenueMetrics(startDate, endDate);

        // Group revenue by tournament
        const registrations = await prisma.registration.findMany({
          where: {
            paid: true,
            paidAt: { gte: startDate, lte: endDate },
          },
          include: {
            tournament: {
              select: { name: true, entryFee: true },
            },
          },
        });

        const revenueByTournament = new Map<string, { revenue: number; participants: number }>();
        registrations.forEach((reg: any) => {
          const name = reg.tournament.name;
          const fee = reg.tournament.entryFee ? Number(reg.tournament.entryFee) : 0;

          if (revenueByTournament.has(name)) {
            const current = revenueByTournament.get(name)!;
            revenueByTournament.set(name, {
              revenue: current.revenue + fee,
              participants: current.participants + 1,
            });
          } else {
            revenueByTournament.set(name, { revenue: fee, participants: 1 });
          }
        });

        reportBuffer = await reportService.generateFinancialReport(
          {
            period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
            totalRevenue: metrics.totalRevenue,
            totalTransactions: metrics.totalTransactions,
            averageTransactionValue: metrics.averageTransactionValue,
            revenueByTournament: Array.from(revenueByTournament.entries()).map(
              ([tournament, data]) => ({
                tournament,
                revenue: data.revenue,
                participants: data.participants,
              })
            ),
          },
          format as ReportFormat
        );
        reportTitle = 'Financial_Report';
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    // Save report to database
    const report = await prisma.report.create({
      data: {
        title: reportTitle,
        reportType,
        format,
        parameters,
        fileSize: reportBuffer.length,
        // In production, upload to cloud storage and store URL
        fileUrl: `/api/reports/download/${reportTitle}`,
      },
    });

    // Return report buffer as download
    const contentType =
      format === 'PDF'
        ? 'application/pdf'
        : format === 'EXCEL'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv';

    const extension = format === 'PDF' ? 'pdf' : format === 'EXCEL' ? 'xlsx' : 'csv';

    return new NextResponse(new Uint8Array(reportBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${reportTitle}.${extension}"`,
        'X-Report-ID': report.id,
      },
    });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
