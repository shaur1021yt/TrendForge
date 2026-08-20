'use client';

import { useState, useEffect } from 'react';
import { getScoreEmoji, getStatusColor } from '@/lib/utils';
import { TrendingUp, Filter, RefreshCw, Check, X } from 'lucide-react';
import type { Topic } from '@/lib/types';

export default function OpportunitiesPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchTopics = () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '50' });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    fetch(`/api/admin/topics?${params}`)
      .then(r => r.json())
      .then(d => { setTopics(d.topics); setTotal(d.total); setLoading(false); });
  };

  useEffect(() => { fetchTopics(); }, [statusFilter, categoryFilter]);

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/admin/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    fetchTopics();
  };

  const categories = ['technology','gaming','education','finance','shopping','fitness','travel','home','cars','entertainment','productivity','business','career','lifestyle','ai'];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Opportunities</h1>
          <p className="text-muted-foreground mt-1">{total} total topics discovered</p>
        </div>
        <button onClick={fetchTopics} className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="calc-input !w-auto !py-1.5 text-sm">
            <option value="all">All Statuses</option>
            <option value="discovered">Discovered</option>
            <option value="approved">Approved</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="calc-input !w-auto !py-1.5 text-sm">
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="space-y-3 py-4">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="pb-3 font-medium">Topic</th>
                <th className="pb-3 font-medium">Score</th>
                <th className="pb-3 font-medium">Demand</th>
                <th className="pb-3 font-medium">Competition</th>
                <th className="pb-3 font-medium">Commercial Intent</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((topic) => (
                <tr key={topic.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                  <td className="py-3 text-foreground font-medium max-w-[280px] truncate">{topic.topic}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
                      topic.opportunity_score >= 75 ? 'bg-green-100 text-green-700' :
                      topic.opportunity_score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {getScoreEmoji(topic.opportunity_score)} {topic.opportunity_score}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground">{topic.estimated_demand}/100</td>
                  <td className="py-3 text-muted-foreground">{topic.competition}/100</td>
                  <td className="py-3 text-muted-foreground">{topic.commercial_intent}/100</td>
                  <td className="py-3 text-muted-foreground capitalize">{topic.category}</td>
                  <td className="py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(topic.status)}`}>{topic.status}</span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      {topic.status === 'discovered' && (
                        <>
                          <button onClick={() => updateStatus(topic.id, 'approved')} className="p-1.5 hover:bg-green-100 rounded text-green-600" title="Approve">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => updateStatus(topic.id, 'archived')} className="p-1.5 hover:bg-red-100 rounded text-red-600" title="Reject">
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {topics.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium mb-1">No opportunities found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
