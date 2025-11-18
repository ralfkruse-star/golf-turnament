import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AnalyticsService } from '@/infrastructure/services/analytics-service';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = params.id;
    const analyticsService = new AnalyticsService(prisma);
    const metrics = await analyticsService.calculateTournamentMetrics(tournamentId);

    return NextResponse.json(metrics, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching tournament metrics:', error);

    if (error.message === 'Tournament not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch tournament metrics' },
      { status: 500 }
    );
  }
}
