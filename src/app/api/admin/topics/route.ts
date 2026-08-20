import { NextRequest, NextResponse } from 'next/server';
import { getAllTopics, getTopicCount, updateTopicStatus, seedTopics } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await seedTopics();
  const sp = request.nextUrl.searchParams;
  const topics = await getAllTopics({
    status: sp.get('status') || undefined,
    category: sp.get('category') || undefined,
    limit: parseInt(sp.get('limit') || '50'),
  });
  const total = await getTopicCount();
  return NextResponse.json({ topics, total });
}

export async function POST(request: NextRequest) {
  const { id, status } = await request.json();
  if (!id || !status) return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
  await updateTopicStatus(id, status);
  return NextResponse.json({ ok: true });
}
