'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Calculator, Search as SearchIcon, Flame, Filter } from 'lucide-react';
import type { Tool } from '@/lib/types';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [results, setResults] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&category=${category}`);
      const data = await res.json();
      setResults(data.tools || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, [query, category]);

  useEffect(() => { search(); }, [search]);

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'gaming', label: '🎮 Gaming' },
    { value: 'finance', label: '💰 Finance' },
    { value: 'education', label: '📚 Education' },
    { value: 'fitness', label: '💪 Fitness' },
    { value: 'technology', label: '💻 Technology' },
    { value: 'ai', label: '🤖 AI' },
    { value: 'career', label: '📈 Career' },
    { value: 'travel', label: '✈️ Travel' },
    { value: 'home', label: '🏠 Home' },
    { value: 'shopping', label: '🛒 Shopping' },
    { value: 'lifestyle', label: '🌟 Lifestyle' },
  ];

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />
            <span className="text-lg font-bold gradient-text">TrendForge</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Header */}
        <h1 className="text-3xl font-bold text-foreground mb-2">Search Tools</h1>
        <p className="text-muted-foreground mb-8">Find calculators, comparison tools, and resources</p>

        {/* Search Bar */}
        <div className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a tool or topic..."
              className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-lg"
              autoFocus
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-3 bg-card border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary outline-none"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <Calculator className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-bold text-foreground mb-2">No tools found</h3>
            <p className="text-muted-foreground">
              {query ? `No results for "${query}". Try a different search.` : 'Tools will appear once Forge discovers opportunities.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">{results.length} tools found</p>
            {results.map((tool) => (
              <Link
                key={tool.id}
                href={`/tools/${tool.slug}`}
                className="block tool-card card-hover"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                    <Calculator className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground hover:text-primary transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{tool.description}</p>
                    <div className="flex items-center gap-3 mt-2">
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

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="skeleton h-8 w-48 rounded" /></div>}>
      <SearchContent />
    </Suspense>
  );
}


