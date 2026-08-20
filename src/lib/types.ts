// ============================================
// TREND FORGE AI — Core Types
// ============================================

// --- Opportunity / Topic ---
export interface Topic {
  id: string;
  topic: string;
  slug: string;
  category: string;
  trend_score: number;
  growth_rate: number;
  estimated_demand: number;
  commercial_intent: number;
  competition: number;
  tool_potential: number;
  opportunity_score: number;
  related_keywords: string; // JSON array
  status: TopicStatus;
  source: string;
  date_discovered: string;
  date_updated: string;
}

export type TopicStatus =
  | 'discovered'
  | 'analyzing'
  | 'approved'
  | 'generating'
  | 'published'
  | 'growing'
  | 'declining'
  | 'archived'
  | 'needs_improvement';

// --- Tool / Page ---
export interface Tool {
  id: string;
  topic_id: string;
  title: string;
  slug: string;
  description: string;
  tool_type: ToolType;
  category: string;
  content: string; // HTML content
  inputs_schema: string; // JSON
  outputs_schema: string; // JSON
  meta_title: string;
  meta_description: string;
  canonical_url: string;
  og_image: string;
  structured_data: string; // JSON-LD
  quality_score: number;
  status: ToolStatus;
  version: number;
  affiliate_links: string; // JSON
  related_tools: string; // JSON array of slugs
  date_created: string;
  date_published: string;
  date_updated: string;
}

export type ToolType =
  | 'calculator'
  | 'comparison'
  | 'quiz'
  | 'generator'
  | 'estimator'
  | 'simulator'
  | 'tracker'
  | 'planner'
  | 'converter'
  | 'recommendation';

export type ToolStatus = 'draft' | 'quality_check' | 'published' | 'archived';

// --- Analytics ---
export interface PageAnalytics {
  id: string;
  tool_id: string;
  date: string;
  page_views: number;
  unique_visitors: number;
  tool_starts: number;
  tool_completions: number;
  shares: number;
  affiliate_clicks: number;
  outbound_clicks: number;
  avg_time_on_page: number;
  bounce_rate: number;
}

// --- Revenue ---
export interface RevenueEntry {
  id: string;
  date: string;
  source: 'affiliate' | 'advertising' | 'subscription' | 'sponsored';
  amount: number;
  currency: string;
  tool_id?: string;
  details: string; // JSON
}

// --- Affiliate ---
export interface AffiliateLink {
  id: string;
  tool_id: string;
  product_name: string;
  product_url: string;
  affiliate_url: string;
  network: string;
  category: string;
  price?: number;
  clicks: number;
  conversions: number;
  revenue: number;
  created_at: string;
}

// --- User ---
export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro';
  created_at: string;
}

export interface SavedTool {
  id: string;
  user_id: string;
  tool_id: string;
  result: string; // JSON
  saved_at: string;
}

// --- Automation ---
export interface AutomationJob {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: string; // JSON
  output: string; // JSON
  error?: string;
  started_at: string;
  completed_at?: string;
}

// --- Settings ---
export interface AutomationSettings {
  enabled: boolean;
  max_pages_per_day: number;
  min_opportunity_score: number;
  min_quality_score: number;
  allowed_categories: string[];
  ai_model: string;
  discovery_interval_hours: number;
  last_run?: string;
}

// --- Category ---
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  auto_discovered: boolean;
  tools_count: number;
}

// --- Subscription ---
export interface Subscription {
  id: string;
  email: string;
  status: 'active' | 'unsubscribed';
  subscribed_at: string;
  unsubscribed_at?: string;
}

// --- Dashboard Stats ---
export interface DashboardStats {
  total_tools: number;
  published_tools: number;
  draft_tools: number;
  total_topics: number;
  total_page_views: number;
  total_unique_visitors: number;
  total_affiliate_clicks: number;
  total_revenue: number;
  top_tools: Tool[];
  top_categories: { category: string; count: number; revenue: number }[];
  recent_analytics: PageAnalytics[];
  recent_revenue: RevenueEntry[];
}

// --- Forge Report ---
export interface ForgeReport {
  date: string;
  opportunities_discovered: number;
  opportunities_passed_threshold: number;
  tools_generated: number;
  tools_passed_quality: number;
  tools_published: number;
  top_performing_tool: { title: string; affiliate_clicks: number };
  fastest_growing_topic: string;
}
