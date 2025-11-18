import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const reports = await prisma.report.findMany({
      take: limit,
      skip: offset,
      orderBy: {
        generatedAt: 'desc',
      },
      include: {
        generator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const total = await prisma.report.count();

    return NextResponse.json(
      {
        reports,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
