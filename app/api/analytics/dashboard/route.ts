import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AnalyticsService } from '@/infrastructure/services/analytics-service';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const analyticsService = new AnalyticsService(prisma);
    const metrics = await analyticsService.getDashboardMetrics();

    return NextResponse.json(metrics, { status: 200 });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}
