'use client';

import { useState, useEffect } from 'react';
import { getStatusColor } from '@/lib/utils';
import { Wrench, ExternalLink, Zap } from 'lucide-react';
import type { Tool } from '@/lib/types';

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchTools = () => {
    setLoading(true);
    fetch('/api/admin/tools?limit=50')
      .then(r => r.json())
      .then(d => { setTools(d.tools); setLoading(false); });
  };

  useEffect(() => { fetchTools(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    await fetch('/api/admin/tools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'generate' }) });
    fetchTools();
    setGenerating(false);
  };

  const toolTypes: Record<string, string> = {
    calculator: '🔢 Calculator', comparison: '📊 Comparison', quiz: '❓ Quiz',
    generator: '⚙️ Generator', estimator: '📈 Estimator', simulator: '🎯 Simulator',
    tracker: '📋 Tracker', planner: '📅 Planner', converter: '🔄 Converter',
    recommendation: '💡 Recommendation',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tools</h1>
          <p className="text-muted-foreground mt-1">{tools.length} tools in the system</p>
        </div>
        <button onClick={handleGenerate} disabled={generating}
          className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50">
          <Zap className="h-4 w-4" /> {generating ? 'Generating...' : 'Generate Tools'}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="bg-card border border-border rounded-xl p-6 h-48 animate-pulse" />)}
        </div>
      ) : tools.length === 0 ? (
        <div className="bg-card border border-border rounded-xl text-center py-16">
          <Wrench className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-bold text-foreground mb-2">No tools yet</h3>
          <p className="text-muted-foreground mb-4">Forge is looking for your first opportunities.</p>
          <button onClick={handleGenerate} className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-medium inline-flex items-center gap-2 hover:opacity-90">
            <Zap className="h-5 w-5" /> Start Forge
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <div key={tool.id} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs text-muted-foreground">{toolTypes[tool.tool_type] || tool.tool_type}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(tool.status)}`}>{tool.status}</span>
              </div>
              <h3 className="font-bold text-foreground mb-2 line-clamp-2">{tool.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{tool.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground capitalize">{tool.category}</span>
                <a href={`/tools/${tool.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium">
                  View <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
