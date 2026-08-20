import Link from 'next/link';
import { getPublishedTools, seedTopics } from '@/lib/data';
import { Flame, Wrench, TrendingUp, Search, Zap, ArrowRight, Calculator, Lightbulb } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  await seedTopics();
  const tools = await getPublishedTools(12);

  return (
    <div className="min-h-screen">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-7 w-7 text-orange-500" />
            <span className="text-xl font-bold gradient-text">TrendForge</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/search" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Search className="h-4 w-4 inline mr-1" /> Search
            </Link>
            <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent" />
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
              <Zap className="h-4 w-4" /> AI-Powered Tools
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6">
              The internet&apos;s trends, <span className="gradient-text">turned into useful tools.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
              TrendForge discovers what people are searching for and creates genuinely useful interactive calculators, comparison tools, and resources — automatically.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/search" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-medium text-lg hover:opacity-90 transition-opacity">
                <Search className="h-5 w-5" /> Find a Tool
              </Link>
              <Link href="/admin" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-muted text-foreground rounded-xl font-medium text-lg hover:bg-muted/80 transition-colors">
                <Wrench className="h-5 w-5" /> Open Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {tools.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-center gap-2 mb-8">
            <Flame className="h-6 w-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-foreground">Trending Right Now</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool, i) => (
              <Link key={tool.id} href={`/tools/${tool.slug}`} className="tool-card card-hover group">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                    <Calculator className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-orange-500 text-xs">🔥</span>
                      <span className="text-xs text-muted-foreground">#{i + 1} trending</span>
                    </div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{tool.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{tool.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {tools.length === 0 && (
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-3">Explore Categories</h2>
            <p className="text-muted-foreground">Browse tools by topic</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[{ name: 'Gaming', icon: '🎮', slug: 'gaming' }, { name: 'Finance', icon: '💰', slug: 'finance' }, { name: 'Education', icon: '📚', slug: 'education' }, { name: 'Fitness', icon: '💪', slug: 'fitness' }, { name: 'AI', icon: '🤖', slug: 'ai' }].map(cat => (
              <Link key={cat.slug} href={`/search?category=${cat.slug}`} className="tool-card card-hover text-center">
                <span className="text-3xl block mb-2">{cat.icon}</span>
                <h3 className="font-semibold text-foreground text-sm">{cat.name}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="bg-muted/50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground text-center mb-12">How TrendForge Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"><TrendingUp className="h-7 w-7 text-primary" /></div>
              <h3 className="font-bold text-foreground mb-2">Discovers Trends</h3>
              <p className="text-sm text-muted-foreground">Our AI scans the web for emerging search demand and identifies topics people need help with.</p>
            </div>
            <div className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4"><Lightbulb className="h-7 w-7 text-accent" /></div>
              <h3 className="font-bold text-foreground mb-2">Creates Useful Tools</h3>
              <p className="text-sm text-muted-foreground">Not articles — actual interactive calculators, comparison tools, and resources that answer real questions.</p>
            </div>
            <div className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4"><Zap className="h-7 w-7 text-green-600" /></div>
              <h3 className="font-bold text-foreground mb-2">Self-Improves</h3>
              <p className="text-sm text-muted-foreground">The system monitors performance, identifies winners, expands successful topics, and optimizes underperformers.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] rounded-3xl p-10 md:p-16 text-center text-white">
          <Flame className="h-12 w-12 text-orange-300 mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Building with Forge</h2>
          <p className="text-indigo-200 max-w-xl mx-auto mb-8">Let our AI discover the best opportunities and automatically create useful tools for your audience.</p>
          <Link href="/admin" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#1e1b4b] rounded-xl font-bold text-lg hover:bg-white/90 transition-colors">
            Open Dashboard <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2"><Flame className="h-5 w-5 text-orange-500" /><span className="font-bold text-foreground">TrendForge AI</span></div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} TrendForge AI. Tools are estimates — not professional advice.</p>
        </div>
      </footer>
    </div>
  );
}
