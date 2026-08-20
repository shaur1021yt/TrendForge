'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, TrendingUp, MousePointerClick, CreditCard, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RevenuePage() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueByDate, setRevenueByDate] = useState<{ date: string; amount: number }[]>([]);

  useEffect(() => {
    fetch('/api/admin/revenue')
      .then(r => r.json())
      .then(d => {
        setTotalRevenue(d.totalRevenue || 0);
        setRevenueByDate(d.byDate || []);
      });
  }, []);

  const revenueCards = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'This Month', value: formatCurrency(revenueByDate.reduce((a, b) => a + (b.amount || 0), 0)), icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Affiliate Clicks', value: '0', icon: MousePointerClick, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Conversions', value: '0', icon: CreditCard, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Revenue</h1>
        <p className="text-muted-foreground mt-1">Track affiliate, advertising, and subscription income</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {revenueCards.map(card => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-2`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className="text-xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-foreground mb-4">Revenue by Date</h3>
        {revenueByDate.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByDate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
            <div className="text-center"><DollarSign className="h-12 w-12 mx-auto mb-2 opacity-30" /><p>No revenue data yet</p></div>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-bold text-foreground">Monetization Setup</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-muted/50 rounded-xl">
            <h4 className="font-semibold text-foreground mb-1">1. Affiliate Revenue</h4>
            <p className="text-sm text-muted-foreground">Configure affiliate program IDs in Settings.</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-xl">
            <h4 className="font-semibold text-foreground mb-1">2. Advertising</h4>
            <p className="text-sm text-muted-foreground">Integrate Google AdSense via environment variables.</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-xl">
            <h4 className="font-semibold text-foreground mb-1">3. Premium Subscriptions</h4>
            <p className="text-sm text-muted-foreground">TrendForge Pro ($9.99/mo) — optional for users.</p>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm">
        <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-yellow-800">Revenue Tracking Note</p>
          <p className="text-yellow-700 mt-1">Revenue data reflects actual tracked transactions. Configure affiliate programs in Settings to start tracking.</p>
        </div>
      </div>
    </div>
  );
}
