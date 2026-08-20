import { NextResponse } from 'next/server';
import { getDashboardStats, getForgeReport, seedTopics } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  await seedTopics();
  const stats = await getDashboardStats();
  const report = await getForgeReport();
  return NextResponse.json({ stats, report });
}
