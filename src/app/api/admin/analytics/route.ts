import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsSummary, getAnalyticsByDate } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const days = parseInt(sp.get('days') || '30');
  const toolId = sp.get('toolId') || undefined;

  const summary = getAnalyticsSummary(toolId || undefined);
  const chartData = getAnalyticsByDate(days);
  return NextResponse.json({ summary, chartData });
}
