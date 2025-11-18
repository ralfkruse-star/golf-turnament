import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AnalyticsService } from '@/infrastructure/services/analytics-service';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const playerId = params.id;
    const analyticsService = new AnalyticsService(prisma);
    const performance = await analyticsService.calculatePlayerPerformance(playerId);

    return NextResponse.json(performance, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching player performance:', error);

    if (error.message === 'Player not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch player performance' },
      { status: 500 }
    );
  }
}
