import { NextRequest, NextResponse } from 'next/server';
import { trackPageView, trackToolStart, trackToolCompletion, trackAffiliateClick } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toolId, event } = body;

    if (!toolId || !event) {
      return NextResponse.json({ error: 'Missing toolId or event' }, { status: 400 });
    }

    switch (event) {
      case 'page_view':
        trackPageView(toolId);
        break;
      case 'tool_start':
        trackToolStart(toolId);
        break;
      case 'tool_complete':
        trackToolCompletion(toolId);
        break;
      case 'affiliate_click':
        trackAffiliateClick(toolId);
        break;
      default:
        return NextResponse.json({ error: 'Unknown event' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
