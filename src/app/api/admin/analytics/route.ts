import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsSummary, getAnalyticsByDate } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const summary = await getAnalyticsSummary(sp.get('toolId') || undefined);
  const chartData = await getAnalyticsByDate(parseInt(sp.get('days') || '30'));
  return NextResponse.json({ summary, chartData });
}
