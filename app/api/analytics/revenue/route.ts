import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AnalyticsService } from '@/infrastructure/services/analytics-service';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Default to last 30 days if not provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end);
    if (!startDate) {
      start.setDate(start.getDate() - 30);
    }

    const analyticsService = new AnalyticsService(prisma);
    const metrics = await analyticsService.calculateRevenueMetrics(start, end);

    return NextResponse.json(metrics, { status: 200 });
  } catch (error) {
    console.error('Error fetching revenue metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue metrics' },
      { status: 500 }
    );
  }
}
