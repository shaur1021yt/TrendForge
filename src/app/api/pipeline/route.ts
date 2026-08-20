import { NextRequest, NextResponse } from 'next/server';
import { runFullPipeline, runDiscovery, runToolGeneration, getAutomationSettings } from '@/lib/data';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'full';

    if (action === 'reset') {
      const db = await getDb();
      db.prepare('UPDATE topics SET status = ? WHERE status != ?').run('discovered', 'discovered');
      db.prepare('UPDATE tools SET status = ? WHERE status != ?').run('draft', 'draft');
      const countRow = db.prepare('SELECT COUNT(*) as c FROM topics').get() as { c: number } | undefined;
      return NextResponse.json({ ok: true, reset: countRow?.c ?? 0 });
    }

    if (action === 'enable') {
      const { updateAutomationSettings } = await import('@/lib/data');
      await updateAutomationSettings({ enabled: true });
      return NextResponse.json({ ok: true });
    }

    const action2 = body.action || 'full';
    let result: Record<string, unknown>;
    switch (action2) {
      case 'discover': result = { discovery: await runDiscovery() }; break;
      case 'generate': result = { generation: await runToolGeneration() }; break;
      default: result = await runFullPipeline();
    }
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  const settings = await getAutomationSettings();
  return NextResponse.json({ settings });
}
