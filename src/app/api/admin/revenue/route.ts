import { NextRequest, NextResponse } from 'next/server';
import { getTotalRevenue, getRevenueByDate, getRevenueBySource } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const days = parseInt(request.nextUrl.searchParams.get('days') || '30');
  const totalRevenue = await getTotalRevenue();
  const byDate = await getRevenueByDate(days);
  const bySource = await getRevenueBySource();
  return NextResponse.json({ totalRevenue, byDate, bySource });
}
