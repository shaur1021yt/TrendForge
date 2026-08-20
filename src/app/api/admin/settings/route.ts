import { NextRequest, NextResponse } from 'next/server';
import { getAutomationSettings, updateAutomationSettings, getAllCategories } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = getAutomationSettings();
  const categories = getAllCategories();
  return NextResponse.json({ settings, categories });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  updateAutomationSettings(body);
  return NextResponse.json({ ok: true });
}
