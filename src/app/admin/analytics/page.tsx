'use client';

import { useState, useEffect } from 'react';
import { formatNumber } from '@/lib/utils';
import { BarChart3, Eye, Users, MousePointerClick, Share2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface AnalyticsSummary {
  totalPageViews: number;
  totalUniqueVisitors: number;
  totalToolStarts: number;
  totalToolCompletions: number;
  totalShares: number;
  totalAffiliateClicks: number;
  avgBounceRate: number;
}

interface ChartPoint {
  date: string;
  pageViews: number;
  visitors: number;
  toolStarts: number;
  revenue: number;
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    fetch(`/api/admin/analytics?days=${period}`)
      .then(r => r.json())
      .then(d => { setSummary(d.summary); setChartData(d.chartData || []); });
  }, [period]);

  const metricCards = [
    { label: 'Page Views', value: formatNumber(summary?.totalPageViews ?? 0), icon: Eye, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Unique Visitors', value: formatNumber(summary?.totalUniqueVisitors ?? 0), icon: Users, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Tool Starts', value: formatNumber(summary?.totalToolStarts ?? 0), icon: BarChart3, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Tool Completions', value: formatNumber(summary?.totalToolCompletions ?? 0), icon: MousePointerClick, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Shares', value: formatNumber(summary?.totalShares ?? 0), icon: Share2, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { label: 'Affiliate Clicks', value: formatNumber(summary?.totalAffiliateClicks ?? 0), icon: MousePointerClick, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Track performance across all tools</p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30, 90].map(d => (
            <button key={d} onClick={() => setPeriod(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === d ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricCards.map(card => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-2`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className="text-xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-foreground mb-4">Traffic Over Time</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="pageViews" stroke="#6366f1" strokeWidth={2} name="Page Views" />
                <Line type="monotone" dataKey="visitors" stroke="#10b981" strokeWidth={2} name="Visitors" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No analytics data yet</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-foreground mb-4">Tool Usage</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="toolStarts" fill="#8b5cf6" name="Tool Starts" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
              <div className="text-center">
                <MousePointerClick className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No usage data yet</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 border-primary/20 bg-primary/5">
        <p className="text-sm text-muted-foreground">
          <strong>Analytics Note:</strong> Data is collected automatically when users interact with published tools. For production use, integrate with Google Analytics or similar.
        </p>
      </div>
    </div>
  );
}
