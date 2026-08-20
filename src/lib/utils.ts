// ============================================
// TREND FORGE AI — Utility Functions
// ============================================
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + '…';
}

export function getScoreEmoji(score: number): string {
  if (score >= 90) return '🔥';
  if (score >= 75) return '⭐';
  if (score >= 60) return '👍';
  if (score >= 40) return '🤔';
  return '❄️';
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent opportunity';
  if (score >= 75) return 'Great opportunity';
  if (score >= 60) return 'Good opportunity';
  if (score >= 40) return 'Moderate opportunity';
  return 'Low opportunity';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    discovered: 'bg-blue-100 text-blue-800',
    analyzing: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    generating: 'bg-purple-100 text-purple-800',
    published: 'bg-emerald-100 text-emerald-800',
    growing: 'bg-orange-100 text-orange-800',
    declining: 'bg-red-100 text-red-800',
    archived: 'bg-gray-100 text-gray-800',
    needs_improvement: 'bg-amber-100 text-amber-800',
    draft: 'bg-gray-100 text-gray-800',
    quality_check: 'bg-yellow-100 text-yellow-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function currentTimestamp(): string {
  return new Date().toISOString();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
