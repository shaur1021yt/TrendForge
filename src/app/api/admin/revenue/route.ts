import { NextRequest, NextResponse } from 'next/server';
import { getTotalRevenue, getRevenueByDate, getRevenueBySource } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const days = parseInt(sp.get('days') || '30');

  const totalRevenue = getTotalRevenue();
  const byDate = getRevenueByDate(days);
  const bySource = getRevenueBySource();
  return NextResponse.json({ totalRevenue, byDate, bySource });
}
