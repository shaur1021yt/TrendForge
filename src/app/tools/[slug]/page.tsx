import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getToolBySlug, getPublishedTools, trackPageView } from '@/lib/data';
import { Flame, Clock, Share2, Bookmark, ExternalLink, AlertTriangle, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import ToolCalculator from '@/components/ToolCalculator';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return { title: 'Tool Not Found' };

  return {
    title: tool.meta_title || tool.title,
    description: tool.meta_description || tool.description,
    alternates: { canonical: tool.canonical_url || `https://trendforge.ai/tools/${tool.slug}` },
    openGraph: {
      title: tool.meta_title || tool.title,
      description: tool.meta_description || tool.description,
      type: 'website',
      url: `https://trendforge.ai/tools/${tool.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: tool.meta_title || tool.title,
      description: tool.meta_description || tool.description,
    },
  };
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  // Track page view (fire-and-forget)
  try { trackPageView(tool.id); } catch {}

  const inputs = JSON.parse(tool.inputs_schema) as Record<string, { type: string; label: string; [key: string]: unknown }>;
  const outputs = JSON.parse(tool.outputs_schema) as Record<string, { type: string; label: string; [key: string]: unknown }>;
  const relatedSlugs = JSON.parse(tool.related_tools) as string[];
  const affiliateProducts = JSON.parse(tool.affiliate_links) as { name: string; category: string; description: string }[];
  const faqs = JSON.parse(tool.structured_data)?.faqs || [];

  // Get related tools
  const relatedTools = relatedSlugs
    .map((s) => getToolBySlug(s))
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />
            <span className="text-lg font-bold gradient-text">TrendForge</span>
          </Link>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Share">
              <Share2 className="h-5 w-5 text-muted-foreground" />
            </button>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Save">
              <Bookmark className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link href="/search" className="hover:text-foreground transition-colors">Tools</Link>
          <span>/</span>
          <span className="text-foreground">{tool.title}</span>
        </div>

        {/* Title & Description */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
              {tool.tool_type}
            </span>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">
              {tool.category}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{tool.title}</h1>
          <p className="text-lg text-muted-foreground">{tool.description}</p>
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Last updated: {tool.date_published ? new Date(tool.date_published).toLocaleDateString() : 'Recently'}
            </span>
            <span>•</span>
            <span>Version {tool.version}</span>
          </div>
        </header>

        {/* Interactive Calculator */}
        <section className="mb-10">
          <ToolCalculator
            toolId={tool.id}
            slug={tool.slug}
            inputs={inputs}
            outputs={outputs}
            toolType={tool.tool_type}
            title={tool.title}
          />
        </section>

        {/* Content / Methodology */}
        <section
          className="prose prose-lg max-w-none mb-10"
          dangerouslySetInnerHTML={{ __html: tool.content }}
        />

        {/* Disclaimers for financial/health tools */}
        {['finance', 'fitness'].includes(tool.category) && (
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-10 text-sm">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Disclaimer</p>
              <p className="text-yellow-700 mt-1">
                This tool provides estimates for informational purposes only. It is not financial, medical, or professional advice.
                Always consult with qualified professionals before making important decisions.
                Results are based on general formulas and may not account for your specific situation.
              </p>
            </div>
          </div>
        )}

        {/* FAQ */}
        {faqs.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq: { question: string; answer: string }, i: number) => (
                <details key={i} className="tool-card group" open={i === 0}>
                  <summary className="font-semibold text-foreground cursor-pointer list-none flex items-center justify-between">
                    {faq.question}
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="text-muted-foreground mt-3 leading-relaxed">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Product Recommendations */}
        {affiliateProducts.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-6">Related Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {affiliateProducts.map((product, i) => (
                <div key={i} className="tool-card card-hover">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">{product.category}</span>
                      <h3 className="font-bold text-foreground mt-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                    </div>
                    <a
                      href="#"
                      className="shrink-0 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      Check Price
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              * Product links may be affiliate links. We may earn a commission at no extra cost to you.{' '}
              <Link href="/disclosures" className="underline">Disclosure</Link>
            </p>
          </section>
        )}

        {/* Related Tools */}
        {relatedTools.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-6">Related Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedTools.map((rt) => rt && (
                <Link
                  key={rt.id}
                  href={`/tools/${rt.slug}`}
                  className="tool-card card-hover"
                >
                  <h3 className="font-bold text-foreground hover:text-primary transition-colors">{rt.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{rt.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-10">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="font-medium">TrendForge AI</span>
          </div>
          <p>Tools provide estimates only — not professional advice. © {new Date().getFullYear()} TrendForge AI</p>
        </div>
      </footer>
    </div>
  );
}
