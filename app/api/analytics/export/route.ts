import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ReportService } from '@/infrastructure/services/report-service';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'tournaments';
    const format = searchParams.get('format') || 'csv';

    let data: any[] = [];

    // Fetch data based on type
    switch (type) {
      case 'tournaments':
        data = await prisma.tournament.findMany({
          include: {
            _count: {
              select: { registrations: true },
            },
          },
        });
        break;
      case 'players':
        data = await prisma.player.findMany();
        break;
      case 'registrations':
        data = await prisma.registration.findMany({
          include: {
            player: { select: { firstName: true, lastName: true } },
            tournament: { select: { name: true } },
          },
        });
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const reportService = new ReportService();

    // Export as CSV or JSON
    if (format === 'csv') {
      const csv = await reportService.generateCSV(data);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${type}-export.csv"`,
        },
      });
    } else {
      return NextResponse.json(data, { status: 200 });
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
