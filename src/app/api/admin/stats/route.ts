import { NextResponse } from 'next/server';
import { getDashboardStats, getForgeReport, seedTopics } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  seedTopics();
  const stats = getDashboardStats();
  const report = getForgeReport();
  return NextResponse.json({ stats, report });
}
