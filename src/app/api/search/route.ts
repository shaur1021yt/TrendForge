import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  const category = request.nextUrl.searchParams.get('category') || '';
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');

  const db = await getDb();
  let query = "SELECT * FROM tools WHERE status = 'published'";
  const params: unknown[] = [];
  if (q) { query += ' AND (title LIKE ? OR description LIKE ? OR category LIKE ?)'; const like = `%${q}%`; params.push(like, like, like); }
  if (category) { query += ' AND category = ?'; params.push(category); }
  query += ' ORDER BY quality_score DESC LIMIT ?';
  params.push(limit);

  const tools = db.prepare(query).all(...params);
  return NextResponse.json({ tools, count: tools.length });
}
