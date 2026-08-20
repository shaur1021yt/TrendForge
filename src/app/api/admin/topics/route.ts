import { NextRequest, NextResponse } from 'next/server';
import { getAllTopics, getTopicCount, updateTopicStatus, seedTopics } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  seedTopics();
  const sp = request.nextUrl.searchParams;
  const status = sp.get('status') || undefined;
  const category = sp.get('category') || undefined;
  const limit = parseInt(sp.get('limit') || '50');

  const topics = getAllTopics({
    status: status || undefined,
    category: category || undefined,
    limit,
  });
  const total = getTopicCount();
  return NextResponse.json({ topics, total });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { id, status } = body;
  if (!id || !status) return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
  updateTopicStatus(id, status);
  return NextResponse.json({ ok: true });
}
