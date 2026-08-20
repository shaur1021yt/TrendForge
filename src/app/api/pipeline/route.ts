import { NextRequest, NextResponse } from 'next/server';
import { runFullPipeline, runDiscovery, runToolGeneration, getAutomationSettings } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'full';
    const settings = getAutomationSettings();

    if (!settings.enabled) {
      return NextResponse.json({ error: 'Automation is disabled' }, { status: 400 });
    }

    let result: Record<string, unknown>;

    switch (action) {
      case 'discover':
        result = { discovery: runDiscovery() };
        break;
      case 'generate':
        result = { generation: runToolGeneration() };
        break;
      case 'full':
      default:
        result = runFullPipeline();
        break;
    }

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  const settings = getAutomationSettings();
  return NextResponse.json({ settings });
}
