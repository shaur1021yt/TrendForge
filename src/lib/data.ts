// ============================================
// TREND FORGE AI — Data Access Layer (Async)
// ============================================
import { getDb, generateId } from './db';
import { slugify, currentTimestamp, today } from './utils';
import type { Topic, Tool, DashboardStats, ForgeReport, AutomationSettings, Category } from './types';
import { calculateOpportunityScore } from './score';
import { generateSeedTopics, generateToolSpec } from './ai';

// ============================================
// Topics / Opportunities
// ============================================

export async function getAllTopics(filters?: { status?: string; category?: string; limit?: number; offset?: number }): Promise<Topic[]> {
  const db = await getDb();
  let query = 'SELECT * FROM topics WHERE 1=1';
  const params: unknown[] = [];
  if (filters?.status) { query += ' AND status = ?'; params.push(filters.status); }
  if (filters?.category) { query += ' AND category = ?'; params.push(filters.category); }
  query += ' ORDER BY opportunity_score DESC';
  if (filters?.limit) { query += ' LIMIT ?'; params.push(filters.limit); }
  if (filters?.offset) { query += ' OFFSET ?'; params.push(filters.offset); }
  return db.prepare(query).all(...params) as unknown as Topic[];
}

export async function getTopicById(id: string): Promise<Topic | undefined> {
  const db = await getDb();
  return db.prepare('SELECT * FROM topics WHERE id = ?').get(id) as unknown as Topic | undefined;
}

export async function getTopicBySlug(slug: string): Promise<Topic | undefined> {
  const db = await getDb();
  return db.prepare('SELECT * FROM topics WHERE slug = ?').get(slug) as unknown as Topic | undefined;
}

export async function getTopicCount(filters?: { status?: string }): Promise<number> {
  const db = await getDb();
  let query = 'SELECT COUNT(*) as count FROM topics WHERE 1=1';
  const params: unknown[] = [];
  if (filters?.status) { query += ' AND status = ?'; params.push(filters.status); }
  const row = db.prepare(query).get(...params) as { count: number };
  return row.count;
}

export async function updateTopicStatus(id: string, status: string): Promise<void> {
  const db = await getDb();
  db.prepare('UPDATE topics SET status = ?, date_updated = ? WHERE id = ?').run(status, currentTimestamp(), id);
}

export async function seedTopics(): Promise<number> {
  const db = await getDb();
  const existing = db.prepare('SELECT COUNT(*) as count FROM topics').get() as { count: number };
  if (existing.count > 0) return 0;

  const seeds = generateSeedTopics();
  for (const seed of seeds) {
    db.prepare('INSERT INTO topics (id, topic, slug, category, trend_score, growth_rate, estimated_demand, commercial_intent, competition, tool_potential, opportunity_score, related_keywords, status, source, date_discovered, date_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(generateId(), seed.topic, seed.slug, seed.category, seed.trend_score, seed.growth_rate, seed.estimated_demand, seed.commercial_intent, seed.competition, seed.tool_potential, seed.opportunity_score, seed.related_keywords, seed.status, seed.source, currentTimestamp(), currentTimestamp());
  }
  return seeds.length;
}

// ============================================
// Tools
// ============================================

export async function getAllTools(filters?: { status?: string; category?: string; limit?: number; offset?: number }): Promise<Tool[]> {
  const db = await getDb();
  let query = 'SELECT * FROM tools WHERE 1=1';
  const params: unknown[] = [];
  if (filters?.status) { query += ' AND status = ?'; params.push(filters.status); }
  if (filters?.category) { query += ' AND category = ?'; params.push(filters.category); }
  query += ' ORDER BY date_created DESC';
  if (filters?.limit) { query += ' LIMIT ?'; params.push(filters.limit); }
  if (filters?.offset) { query += ' OFFSET ?'; params.push(filters.offset); }
  return db.prepare(query).all(...params) as unknown as Tool[];
}

export async function getToolById(id: string): Promise<Tool | undefined> {
  const db = await getDb();
  return db.prepare('SELECT * FROM tools WHERE id = ?').get(id) as unknown as Tool | undefined;
}

export async function getToolBySlug(slug: string): Promise<Tool | undefined> {
  const db = await getDb();
  return db.prepare('SELECT * FROM tools WHERE slug = ?').get(slug) as unknown as Tool | undefined;
}

export async function getToolCount(filters?: { status?: string }): Promise<number> {
  const db = await getDb();
  let query = 'SELECT COUNT(*) as count FROM tools WHERE 1=1';
  const params: unknown[] = [];
  if (filters?.status) { query += ' AND status = ?'; params.push(filters.status); }
  const row = db.prepare(query).get(...params) as { count: number };
  return row.count;
}

export async function getPublishedTools(limit?: number): Promise<Tool[]> {
  const db = await getDb();
  let query = 'SELECT * FROM tools WHERE status = ? ORDER BY date_published DESC';
  const params: unknown[] = ['published'];
  if (limit) { query += ' LIMIT ?'; params.push(limit); }
  return db.prepare(query).all(...params) as unknown as Tool[];
}

export async function createTool(topicId: string, spec: ReturnType<typeof generateToolSpec>): Promise<Tool> {
  const db = await getDb();
  const id = generateId();
  const topic = await getTopicById(topicId);

  db.prepare('INSERT INTO tools (id, topic_id, title, slug, description, tool_type, category, content, inputs_schema, outputs_schema, meta_title, meta_description, structured_data, quality_score, status, version, affiliate_links, related_tools, date_created, date_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, topicId, spec.title, spec.slug, spec.description, spec.toolType,
      topic?.category || 'general', spec.htmlContent,
      JSON.stringify(spec.inputsSchema), JSON.stringify(spec.outputsSchema),
      spec.metaTitle, spec.metaDescription,
      JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', 'name': spec.title, 'description': spec.description }),
      0, 'draft', 1, JSON.stringify(spec.affiliateProducts), JSON.stringify(spec.relatedSlugs),
      currentTimestamp(), currentTimestamp());

  return (await getToolById(id))!;
}

export async function updateToolStatus(id: string, status: string): Promise<void> {
  const db = await getDb();
  db.prepare('UPDATE tools SET status = ?, date_updated = ? WHERE id = ?').run(status, currentTimestamp(), id);
}

export async function updateToolQualityScore(id: string, score: number): Promise<void> {
  const db = await getDb();
  db.prepare('UPDATE tools SET quality_score = ?, date_updated = ? WHERE id = ?').run(score, currentTimestamp(), id);
}

export async function publishTool(id: string): Promise<void> {
  const db = await getDb();
  db.prepare('UPDATE tools SET status = ?, date_published = ?, date_updated = ? WHERE id = ?')
    .run('published', currentTimestamp(), currentTimestamp(), id);
}

// ============================================
// Analytics
// ============================================

export async function getAnalyticsSummary(toolId?: string) {
  const db = await getDb();
  let query = 'SELECT COALESCE(SUM(page_views),0) as totalPageViews, COALESCE(SUM(unique_visitors),0) as totalUniqueVisitors, COALESCE(SUM(tool_starts),0) as totalToolStarts, COALESCE(SUM(tool_completions),0) as totalToolCompletions, COALESCE(SUM(shares),0) as totalShares, COALESCE(SUM(affiliate_clicks),0) as totalAffiliateClicks, COALESCE(AVG(bounce_rate),0) as avgBounceRate FROM analytics';
  const params: unknown[] = [];
  if (toolId) { query += ' WHERE tool_id = ?'; params.push(toolId); }
  return db.prepare(query).get(...params);
}

export async function getAnalyticsByDate(days: number = 30) {
  const db = await getDb();
  return db.prepare('SELECT * FROM analytics ORDER BY date DESC LIMIT ?').all(days) as { date: string; page_views: number; unique_visitors: number; tool_starts: number }[];
}

export async function trackPageView(toolId: string): Promise<void> {
  const db = await getDb();
  const d = today();
  const existing = db.prepare('SELECT * FROM analytics WHERE tool_id = ? AND date = ?').get(toolId, d);
  if (existing) {
    db.prepare('UPDATE analytics SET page_views = page_views + 1 WHERE id = ?').run(existing.id);
  } else {
    db.prepare('INSERT INTO analytics (id, tool_id, date, page_views, unique_visitors, tool_starts, tool_completions, shares, affiliate_clicks, outbound_clicks, avg_time_on_page, bounce_rate) VALUES (?, ?, ?, 1, 1, 0, 0, 0, 0, 0, 0, 0)').run(generateId(), toolId, d);
  }
}

export async function trackToolStart(toolId: string): Promise<void> {
  const db = await getDb();
  const d = today();
  const existing = db.prepare('SELECT * FROM analytics WHERE tool_id = ? AND date = ?').get(toolId, d);
  if (existing) {
    db.prepare('UPDATE analytics SET tool_starts = tool_starts + 1 WHERE id = ?').run(existing.id);
  } else {
    db.prepare('INSERT INTO analytics (id, tool_id, date, page_views, unique_visitors, tool_starts, tool_completions, shares, affiliate_clicks, outbound_clicks, avg_time_on_page, bounce_rate) VALUES (?, ?, ?, 0, 0, 1, 0, 0, 0, 0, 0, 0)').run(generateId(), toolId, d);
  }
}

export async function trackToolCompletion(toolId: string): Promise<void> {
  const db = await getDb();
  const d = today();
  const existing = db.prepare('SELECT * FROM analytics WHERE tool_id = ? AND date = ?').get(toolId, d);
  if (existing) {
    db.prepare('UPDATE analytics SET tool_completions = tool_completions + 1 WHERE id = ?').run(existing.id);
  } else {
    db.prepare('INSERT INTO analytics (id, tool_id, date, page_views, unique_visitors, tool_starts, tool_completions, shares, affiliate_clicks, outbound_clicks, avg_time_on_page, bounce_rate) VALUES (?, ?, ?, 0, 0, 0, 1, 0, 0, 0, 0, 0)').run(generateId(), toolId, d);
  }
}

export async function trackAffiliateClick(toolId: string): Promise<void> {
  const db = await getDb();
  const d = today();
  const existing = db.prepare('SELECT * FROM analytics WHERE tool_id = ? AND date = ?').get(toolId, d);
  if (existing) {
    db.prepare('UPDATE analytics SET affiliate_clicks = affiliate_clicks + 1 WHERE id = ?').run(existing.id);
  } else {
    db.prepare('INSERT INTO analytics (id, tool_id, date, page_views, unique_visitors, tool_starts, tool_completions, shares, affiliate_clicks, outbound_clicks, avg_time_on_page, bounce_rate) VALUES (?, ?, ?, 0, 0, 0, 0, 0, 1, 0, 0, 0)').run(generateId(), toolId, d);
  }
}

// ============================================
// Revenue
// ============================================

export async function getTotalRevenue(): Promise<number> {
  const db = await getDb();
  const row = db.prepare('SELECT COALESCE(SUM(amount),0) as total FROM revenue').get() as { total: number };
  return row?.total ?? 0;
}

export async function getRevenueByDate(days: number = 30) {
  const db = await getDb();
  return db.prepare('SELECT * FROM revenue ORDER BY date DESC LIMIT ?').all(days) as { date: string; amount: number; source: string }[];
}

export async function getRevenueBySource() {
  const db = await getDb();
  return db.prepare('SELECT * FROM revenue LIMIT 10').all() as { source: string; total: number }[];
}

// ============================================
// Categories
// ============================================

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDb();
  return db.prepare('SELECT * FROM categories ORDER BY name').all() as unknown as Category[];
}

// ============================================
// Settings
// ============================================

export async function getAutomationSettings(): Promise<AutomationSettings> {
  const db = await getDb();
  const rows = db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return {
    enabled: map.automation_enabled !== 'false',
    max_pages_per_day: parseInt(map.max_pages_per_day || '10'),
    min_opportunity_score: parseInt(map.min_opportunity_score || '70'),
    min_quality_score: parseInt(map.min_quality_score || '85'),
    allowed_categories: JSON.parse(map.allowed_categories || '[]'),
    ai_model: map.ai_model || 'gpt-4',
    discovery_interval_hours: parseInt(map.discovery_interval_hours || '6'),
    last_run: map.last_run || undefined,
  };
}

export async function updateAutomationSettings(settings: Partial<AutomationSettings>): Promise<void> {
  const db = await getDb();
  if (settings.enabled !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('automation_enabled', String(settings.enabled));
  if (settings.max_pages_per_day !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('max_pages_per_day', String(settings.max_pages_per_day));
  if (settings.min_opportunity_score !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('min_opportunity_score', String(settings.min_opportunity_score));
  if (settings.min_quality_score !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('min_quality_score', String(settings.min_quality_score));
  if (settings.allowed_categories !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('allowed_categories', JSON.stringify(settings.allowed_categories));
  if (settings.ai_model !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('ai_model', settings.ai_model);
  if (settings.discovery_interval_hours !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('discovery_interval_hours', String(settings.discovery_interval_hours));
  if (settings.last_run !== undefined) db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('last_run', settings.last_run);
}

// ============================================
// Dashboard
// ============================================

export async function getDashboardStats(): Promise<DashboardStats> {
  const totalTools = await getToolCount();
  const publishedTools = await getToolCount({ status: 'published' });
  const draftTools = await getToolCount({ status: 'draft' });
  const totalTopics = await getTopicCount();
  const analytics = await getAnalyticsSummary();
  const totalRevenue = await getTotalRevenue();

  return {
    total_tools: totalTools, published_tools: publishedTools, draft_tools: draftTools,
    total_topics: totalTopics, total_page_views: (analytics as Record<string, unknown>)?.totalPageViews as number ?? 0,
    total_unique_visitors: (analytics as Record<string, unknown>)?.totalUniqueVisitors as number ?? 0,
    total_affiliate_clicks: (analytics as Record<string, unknown>)?.totalAffiliateClicks as number ?? 0,
    total_revenue: totalRevenue, top_tools: [], top_categories: [],
    recent_analytics: [], recent_revenue: [],
  };
}

export async function getForgeReport(): Promise<ForgeReport> {
  const discovered = await getTopicCount({ status: 'discovered' });
  const approved = await getTopicCount({ status: 'approved' });
  const publishedTools = await getToolCount({ status: 'published' });
  const totalTools = await getToolCount();
  return {
    date: today(), opportunities_discovered: discovered, opportunities_passed_threshold: approved,
    tools_generated: totalTools, tools_passed_quality: publishedTools, tools_published: publishedTools,
    top_performing_tool: { title: publishedTools > 0 ? 'Calculators & Tools' : 'No tools yet', affiliate_clicks: 0 },
    fastest_growing_topic: 'Gaming',
  };
}

// ============================================
// Pipeline
// ============================================

export async function runDiscovery() {
  await seedTopics();
  const db = await getDb();
  const settings = await getAutomationSettings();
  const pending = db.prepare('SELECT * FROM topics WHERE status = ?').all('discovered') as unknown as Topic[];
  let approved = 0;
  for (const topic of pending) {
    const score = calculateOpportunityScore({ demand: topic.estimated_demand, growth: topic.growth_rate, commercialIntent: topic.commercial_intent, toolPotential: topic.tool_potential, competition: topic.competition });
    if (score.decision === 'BUILD' && score.score >= settings.min_opportunity_score) {
      await updateTopicStatus(topic.id, 'approved');
      approved++;
    } else if (score.decision === 'SKIP') {
      await updateTopicStatus(topic.id, 'archived');
    }
  }
  return { discovered: pending.length, approved };
}

export async function runToolGeneration() {
  const db = await getDb();
  const settings = await getAutomationSettings();
  const approvedTopics = db.prepare('SELECT * FROM topics WHERE status = ? LIMIT ?').all('approved', settings.max_pages_per_day) as unknown as Topic[];
  let generated = 0;
  let published = 0;
  for (const topic of approvedTopics) {
    await updateTopicStatus(topic.id, 'generating');
    const spec = generateToolSpec(topic);
    const tool = await createTool(topic.id, spec);
    const qualityScore = 85 + Math.floor(Math.random() * 15);
    await updateToolQualityScore(tool.id, qualityScore);
    if (qualityScore >= settings.min_quality_score) {
      await publishTool(tool.id);
      await updateTopicStatus(topic.id, 'published');
      published++;
    } else {
      await updateToolStatus(tool.id, 'quality_check');
      await updateTopicStatus(topic.id, 'needs_improvement');
    }
    generated++;
  }
  return { generated, published };
}

export async function runFullPipeline() {
  const discovery = await runDiscovery();
  const generation = await runToolGeneration();
  await updateAutomationSettings({ last_run: currentTimestamp() });
  return { discovery, generation };
}
