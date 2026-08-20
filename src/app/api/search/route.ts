import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const limit = parseInt(searchParams.get('limit') || '50');

  const db = getDb();

  let query = "SELECT * FROM tools WHERE status = 'published'";
  const params: unknown[] = [];

  if (q) {
    query += ' AND (title LIKE ? OR description LIKE ? OR category LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY quality_score DESC, date_published DESC LIMIT ?';
  params.push(limit);

  const tools = db.prepare(query).all(...params);

  return NextResponse.json({ tools, count: tools.length });
}
