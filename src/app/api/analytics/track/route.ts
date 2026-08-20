import { NextRequest, NextResponse } from 'next/server';
import { trackPageView, trackToolStart, trackToolCompletion, trackAffiliateClick } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const { toolId, event } = await request.json();
    if (!toolId || !event) return NextResponse.json({ error: 'Missing toolId or event' }, { status: 400 });

    switch (event) {
      case 'page_view': await trackPageView(toolId); break;
      case 'tool_start': await trackToolStart(toolId); break;
      case 'tool_complete': await trackToolCompletion(toolId); break;
      case 'affiliate_click': await trackAffiliateClick(toolId); break;
      default: return NextResponse.json({ error: 'Unknown event' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
