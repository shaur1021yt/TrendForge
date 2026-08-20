import Link from 'next/link';
import { getPublishedTools, seedTopics } from '@/lib/data';
import { Calculator, Flame } from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'All Tools — Free Calculators & Interactive Resources | TrendForge',
  description: 'Browse all free calculators, comparison tools, and interactive resources on TrendForge AI.',
};

export default async function ToolsPage() {
  await seedTopics();
  const tools = await getPublishedTools();

  return (
    <div className="min-h-screen">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2"><Flame className="h-6 w-6 text-orange-500" /><span className="text-lg font-bold gradient-text">TrendForge</span></Link>
          <Link href="/search" className="text-sm text-muted-foreground hover:text-foreground">Search</Link>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-2">All Tools</h1>
        <p className="text-muted-foreground mb-8">Free interactive calculators, comparison tools, and resources</p>
        {tools.length === 0 ? (
          <div className="text-center py-20">
            <Calculator className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-xl font-bold text-foreground mb-2">No tools published yet</h2>
            <p className="text-muted-foreground mb-6">Forge is discovering opportunities and building tools.</p>
            <Link href="/admin/automation" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-medium hover:opacity-90">Open Automation Dashboard</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map(tool => (
              <Link key={tool.id} href={`/tools/${tool.slug}`} className="tool-card card-hover group">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0"><Calculator className="h-5 w-5 text-primary" /></div>
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{tool.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{tool.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground capitalize">{tool.tool_type}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground capitalize">{tool.category}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
