'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatNumber, getScoreEmoji } from '@/lib/utils';
import {
  Wrench, Eye, MousePointerClick, DollarSign, TrendingUp,
  Flame, ArrowUpRight, Zap, CheckCircle2, Clock, AlertCircle, BarChart3,
} from 'lucide-react';
import type { Topic } from '@/lib/types';

interface DashboardStats {
  total_tools: number;
  published_tools: number;
  draft_tools: number;
  total_topics: number;
  total_page_views: number;
  total_unique_visitors: number;
  total_affiliate_clicks: number;
  total_revenue: number;
}

interface ForgeReport {
  date: string;
  opportunities_discovered: number;
  opportunities_passed_threshold: number;
  tools_generated: number;
  tools_published: number;
  fastest_growing_topic: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [report, setReport] = useState<ForgeReport | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => {
      setStats(d.stats);
      setReport(d.report);
    });
    fetch('/api/admin/topics?limit=8').then(r => r.json()).then(d => {
      setTopics(d.topics);
    });
  }, []);

  const statCards = [
    { label: 'Published Tools', value: stats?.published_tools ?? 0, icon: Wrench, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total Topics', value: stats?.total_topics ?? 0, icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Page Views', value: formatNumber(stats?.total_page_views ?? 0), icon: Eye, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Affiliate Clicks', value: formatNumber(stats?.total_affiliate_clicks ?? 0), icon: MousePointerClick, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Revenue', value: formatCurrency(stats?.total_revenue ?? 0), icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Draft Tools', value: stats?.draft_tools ?? 0, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome to TrendForge AI</p>
        </div>
        <div className="flex gap-3">
          <a href="/" target="_blank" className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors">
            View Public Site
          </a>
          <a href="/admin/automation" className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Run Forge
          </a>
        </div>
      </div>

      {/* Forge Report Card */}
      <div className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] rounded-2xl p-6 text-white">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-white/10 rounded-lg">
            <Flame className="h-6 w-6 text-orange-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Forge Report — {report?.date ?? 'Loading...'}</h2>
            <p className="text-indigo-200 text-sm">Autonomous pipeline status</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-indigo-200 text-sm">Discovered</p>
            <p className="text-2xl font-bold">{report?.opportunities_discovered ?? 0}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-indigo-200 text-sm">Passed Threshold</p>
            <p className="text-2xl font-bold">{report?.opportunities_passed_threshold ?? 0}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-indigo-200 text-sm">Tools Generated</p>
            <p className="text-2xl font-bold">{report?.tools_generated ?? 0}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-indigo-200 text-sm">Published</p>
            <p className="text-2xl font-bold">{report?.tools_published ?? 0}</p>
          </div>
        </div>
        <p className="text-indigo-200 text-sm mt-4">
          🔥 Top-performing tool category: <span className="text-white font-semibold">{report?.fastest_growing_topic ?? 'Gaming'}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-3`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline Status & Recent Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Status */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Pipeline Status
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Discovery', status: 'active', icon: TrendingUp },
              { label: 'Scoring', status: 'active', icon: CheckCircle2 },
              { label: 'Generation', status: (stats?.draft_tools ?? 0) > 0 ? 'active' : 'idle', icon: Wrench },
              { label: 'Quality Check', status: 'idle', icon: AlertCircle },
              { label: 'Publishing', status: 'idle', icon: ArrowUpRight },
            ].map((step) => (
              <div key={step.label} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <step.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{step.label}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  step.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {step.status === 'active' ? '● Active' : '○ Idle'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Opportunities */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Opportunities
            </h3>
            <a href="/admin/opportunities" className="text-sm text-primary hover:underline">View All →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="pb-2 font-medium">Topic</th>
                  <th className="pb-2 font-medium">Score</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((topic) => (
                  <tr key={topic.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 text-foreground font-medium max-w-[300px] truncate">{topic.topic}</td>
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-primary/10 text-primary">
                        {getScoreEmoji(topic.opportunity_score)} {topic.opportunity_score}
                      </span>
                    </td>
                    <td className="py-2.5 text-muted-foreground capitalize">{topic.category}</td>
                    <td className="py-2.5">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        topic.status === 'published' ? 'bg-green-100 text-green-700' :
                        topic.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                        topic.status === 'discovered' ? 'bg-gray-100 text-gray-600' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {topic.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {topics.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No opportunities yet. Click &quot;Run Forge&quot; to start discovery.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <a href="/admin/opportunities" className="bg-card border border-border rounded-xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 group">
          <TrendingUp className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-foreground">Opportunities</h3>
          <p className="text-sm text-muted-foreground">Browse & manage topics</p>
        </a>
        <a href="/admin/tools" className="bg-card border border-border rounded-xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 group">
          <Wrench className="h-8 w-8 text-accent mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-foreground">Tools</h3>
          <p className="text-sm text-muted-foreground">View generated tools</p>
        </a>
        <a href="/admin/analytics" className="bg-card border border-border rounded-xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 group">
          <BarChart3 className="h-8 w-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-foreground">Analytics</h3>
          <p className="text-sm text-muted-foreground">Traffic & engagement</p>
        </a>
        <a href="/admin/revenue" className="bg-card border border-border rounded-xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 group">
          <DollarSign className="h-8 w-8 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-foreground">Revenue</h3>
          <p className="text-sm text-muted-foreground">Affiliate & ad income</p>
        </a>
      </div>
    </div>
  );
}
