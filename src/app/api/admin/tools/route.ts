import { NextRequest, NextResponse } from 'next/server';
import { getAllTools, runFullPipeline } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const tools = await getAllTools({
    status: sp.get('status') || undefined,
    category: sp.get('category') || undefined,
    limit: parseInt(sp.get('limit') || '50'),
  });
  return NextResponse.json({ tools });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (body.action === 'generate') {
    const result = await runFullPipeline();
    return NextResponse.json({ ok: true, result });
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
