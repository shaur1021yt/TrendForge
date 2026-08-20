import { NextRequest, NextResponse } from 'next/server';
import { runFullPipeline, runDiscovery, runToolGeneration, getAutomationSettings } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const settings = await getAutomationSettings();
    if (!settings.enabled) return NextResponse.json({ error: 'Automation is disabled' }, { status: 400 });

    const action = body.action || 'full';
    let result: Record<string, unknown>;
    switch (action) {
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
