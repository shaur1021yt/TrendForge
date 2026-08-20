import { NextRequest, NextResponse } from 'next/server';
import { getAllTools, runFullPipeline } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const status = sp.get('status') || undefined;
  const category = sp.get('category') || undefined;
  const limit = parseInt(sp.get('limit') || '50');

  const tools = getAllTools({
    status: status || undefined,
    category: category || undefined,
    limit,
  });
  return NextResponse.json({ tools });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (body.action === 'generate') {
    const result = runFullPipeline();
    return NextResponse.json({ ok: true, result });
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
