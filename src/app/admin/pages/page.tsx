'use client';

import { useState, useEffect } from 'react';
import { getStatusColor } from '@/lib/utils';
import { FileText, ExternalLink } from 'lucide-react';
import type { Tool } from '@/lib/types';

export default function PagesPage() {
  const [pages, setPages] = useState<Tool[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '100' });
    if (filter !== 'all') params.set('status', filter);
    fetch(`/api/admin/tools?${params}`)
      .then(r => r.json())
      .then(d => { setPages(d.tools || []); setLoading(false); });
  }, [filter]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pages</h1>
        <p className="text-muted-foreground mt-1">{pages.length} pages in the system</p>
      </div>

      <div className="flex items-center gap-3">
        {['all', 'published', 'draft', 'quality_check', 'archived'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-4 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="space-y-3 py-4">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}</div>
        ) : pages.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">No pages yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="pb-3 font-medium">Page Title</th>
                <th className="pb-3 font-medium">URL</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Quality</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {pages.map(page => (
                <tr key={page.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                  <td className="py-3 text-foreground font-medium max-w-[250px] truncate">{page.title}</td>
                  <td className="py-3"><code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">/tools/{page.slug}</code></td>
                  <td className="py-3 text-muted-foreground capitalize">{page.tool_type}</td>
                  <td className="py-3 text-muted-foreground capitalize">{page.category}</td>
                  <td className="py-3"><span className={`font-medium ${page.quality_score >= 85 ? 'text-green-600' : page.quality_score >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{page.quality_score}/100</span></td>
                  <td className="py-3"><span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(page.status)}`}>{page.status}</span></td>
                  <td className="py-3">
                    {page.status === 'published' && <a href={`/tools/${page.slug}`} target="_blank" className="p-1.5 hover:bg-muted rounded text-primary"><ExternalLink className="h-4 w-4" /></a>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
