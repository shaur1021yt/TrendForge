// ============================================
// TREND FORGE AI — Data Access Layer
// ============================================
import { getDb, generateId } from './db';
import { slugify, currentTimestamp, today } from './utils';
import type { Topic, Tool, PageAnalytics, RevenueEntry, DashboardStats, ForgeReport, AutomationJob, AutomationSettings, Category, Subscription } from './types';
import { calculateOpportunityScore, suggestToolType, suggestCategory } from './score';
import { generateSeedTopics, generateToolSpec } from './ai';

// ============================================
// Topics / Opportunities
// ============================================

export function getAllTopics(filters?: { status?: string; category?: string; limit?: number; offset?: number }): Topic[] {
  const db = getDb();
  let query = 'SELECT * FROM topics WHERE 1=1';
  const params: unknown[] = [];

  if (filters?.status) { query += ' AND status = ?'; params.push(filters.status); }
  if (filters?.category) { query += ' AND category = ?'; params.push(filters.category); }

  query += ' ORDER BY opportunity_score DESC';

  if (filters?.limit) { query += ' LIMIT ?'; params.push(filters.limit); }
  if (filters?.offset) { query += ' OFFSET ?'; params.push(filters.offset); }

  return db.prepare(query).all(...params) as Topic[];
}

export function getTopicById(id: string): Topic | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM topics WHERE id = ?').get(id) as Topic | undefined;
}

export function getTopicBySlug(slug: string): Topic | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM topics WHERE slug = ?').get(slug) as Topic | undefined;
}

export function getTopicCount(filters?: { status?: string }): number {
  const db = getDb();
  let query = 'SELECT COUNT(*) as count FROM topics WHERE 1=1';
  const params: unknown[] = [];
  if (filters?.status) { query += ' AND status = ?'; params.push(filters.status); }
  const row = db.prepare(query).get(...params) as { count: number };
  return row.count;
}

export function updateTopicStatus(id: string, status: string): void {
  const db = getDb();
  db.prepare('UPDATE topics SET status = ?, date_updated = ? WHERE id = ?').run(status, currentTimestamp(), id);
}

export function seedTopics(): number {
  const db = getDb();
  const existing = db.prepare('SELECT COUNT(*) as count FROM topics').get() as { count: number };
  if (existing.count > 0) return 0;

  const seeds = generateSeedTopics();
  const stmt = db.prepare(`
    INSERT INTO topics (id, topic, slug, category, trend_score, growth_rate, estimated_demand,
      commercial_intent, competition, tool_potential, opportunity_score, related_keywords, status, source,
      date_discovered, date_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const tx = db.transaction(() => {
    for (const seed of seeds) {
      stmt.run(
        generateId(), seed.topic, seed.slug, seed.category, seed.trend_score,
        seed.growth_rate, seed.estimated_demand, seed.commercial_intent,
        seed.competition, seed.tool_potential, seed.opportunity_score,
        seed.related_keywords, seed.status, seed.source
      );
    }
  });
  tx();
  return seeds.length;
}

// ============================================
// Tools
// ============================================

export function getAllTools(filters?: { status?: string; category?: string; limit?: number; offset?: number }): Tool[] {
  const db = getDb();
  let query = 'SELECT * FROM tools WHERE 1=1';
  const params: unknown[] = [];

  if (filters?.status) { query += ' AND status = ?'; params.push(filters.status); }
  if (filters?.category) { query += ' AND category = ?'; params.push(filters.category); }

  query += ' ORDER BY date_created DESC';

  if (filters?.limit) { query += ' LIMIT ?'; params.push(filters.limit); }
  if (filters?.offset) { query += ' OFFSET ?'; params.push(filters.offset); }

  return db.prepare(query).all(...params) as Tool[];
}

export function getToolById(id: string): Tool | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM tools WHERE id = ?').get(id) as Tool | undefined;
}

export function getToolBySlug(slug: string): Tool | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM tools WHERE slug = ?').get(slug) as Tool | undefined;
}

export function getToolCount(filters?: { status?: string }): number {
  const db = getDb();
  let query = 'SELECT COUNT(*) as count FROM tools WHERE 1=1';
  const params: unknown[] = [];
  if (filters?.status) { query += ' AND status = ?'; params.push(filters.status); }
  const row = db.prepare(query).get(...params) as { count: number };
  return row.count;
}

export function getPublishedTools(limit?: number): Tool[] {
  const db = getDb();
  let query = 'SELECT * FROM tools WHERE status = ? ORDER BY date_published DESC';
  const params: unknown[] = ['published'];
  if (limit) { query += ' LIMIT ?'; params.push(limit); }
  return db.prepare(query).all(...params) as Tool[];
}

export function createTool(topicId: string, spec: ReturnType<typeof generateToolSpec>): Tool {
  const db = getDb();
  const id = generateId();
  const topic = getTopicById(topicId);

  db.prepare(`
    INSERT INTO tools (id, topic_id, title, slug, description, tool_type, category, content,
      inputs_schema, outputs_schema, meta_title, meta_description, structured_data,
      quality_score, status, version, affiliate_links, related_tools,
      date_created, date_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(
    id, topicId, spec.title, spec.slug, spec.description, spec.toolType,
    topic?.category || 'general', spec.htmlContent,
    JSON.stringify(spec.inputsSchema), JSON.stringify(spec.outputsSchema),
    spec.metaTitle, spec.metaDescription,
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': spec.title,
      'description': spec.description,
      'applicationCategory': 'UtilityApplication',
    }),
    0, 'draft', 1,
    JSON.stringify(spec.affiliateProducts),
    JSON.stringify(spec.relatedSlugs),
  );

  return getToolById(id)!;
}

export function updateToolStatus(id: string, status: string): void {
  const db = getDb();
  db.prepare('UPDATE tools SET status = ?, date_updated = ? WHERE id = ?').run(status, currentTimestamp(), id);
}

export function updateToolQualityScore(id: string, score: number): void {
  const db = getDb();
  db.prepare('UPDATE tools SET quality_score = ?, date_updated = ? WHERE id = ?').run(score, currentTimestamp(), id);
}

export function publishTool(id: string): void {
  const db = getDb();
  db.prepare('UPDATE tools SET status = ?, date_published = ?, date_updated = ? WHERE id = ?')
    .run('published', currentTimestamp(), currentTimestamp(), id);
}

// ============================================
// Analytics
// ============================================

export function getAnalyticsSummary(toolId?: string): {
  totalPageViews: number;
  totalUniqueVisitors: number;
  totalToolStarts: number;
  totalToolCompletions: number;
  totalShares: number;
  totalAffiliateClicks: number;
  avgBounceRate: number;
} {
  const db = getDb();
  let query = 'SELECT COALESCE(SUM(page_views),0) as totalPageViews, COALESCE(SUM(unique_visitors),0) as totalUniqueVisitors, COALESCE(SUM(tool_starts),0) as totalToolStarts, COALESCE(SUM(tool_completions),0) as totalToolCompletions, COALESCE(SUM(shares),0) as totalShares, COALESCE(SUM(affiliate_clicks),0) as totalAffiliateClicks, COALESCE(AVG(bounce_rate),0) as avgBounceRate FROM analytics';
  const params: unknown[] = [];
  if (toolId) { query += ' WHERE tool_id = ?'; params.push(toolId); }
  return db.prepare(query).get(...params) as ReturnType<typeof getAnalyticsSummary>;
}

export function getAnalyticsByDate(days: number = 30): { date: string; pageViews: number; visitors: number; toolStarts: number; revenue: number }[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT a.date, COALESCE(SUM(a.page_views),0) as pageViews,
           COALESCE(SUM(a.unique_visitors),0) as visitors,
           COALESCE(SUM(a.tool_starts),0) as toolStarts,
           COALESCE((SELECT SUM(r.amount) FROM revenue r WHERE r.date = a.date),0) as revenue
    FROM analytics a
    WHERE a.date >= date('now', '-' || ? || ' days')
    GROUP BY a.date
    ORDER BY a.date
  `).all(days) as { date: string; pageViews: number; visitors: number; toolStarts: number; revenue: number }[];
  return rows;
}

export function trackPageView(toolId: string): void {
  const db = getDb();
  const d = today();
  const existing = db.prepare('SELECT * FROM analytics WHERE tool_id = ? AND date = ?').get(toolId, d) as PageAnalytics | undefined;
  if (existing) {
    db.prepare('UPDATE analytics SET page_views = page_views + 1, unique_visitors = unique_visitors + 1 WHERE id = ?').run(existing.id);
  } else {
    db.prepare('INSERT INTO analytics (id, tool_id, date, page_views, unique_visitors, tool_starts, tool_completions, shares, affiliate_clicks, outbound_clicks, avg_time_on_page, bounce_rate) VALUES (?, ?, ?, 1, 1, 0, 0, 0, 0, 0, 0, 0)').run(generateId(), toolId, d);
  }
}

export function trackToolStart(toolId: string): void {
  const db = getDb();
  const d = today();
  const existing = db.prepare('SELECT * FROM analytics WHERE tool_id = ? AND date = ?').get(toolId, d) as PageAnalytics | undefined;
  if (existing) {
    db.prepare('UPDATE analytics SET tool_starts = tool_starts + 1 WHERE id = ?').run(existing.id);
  } else {
    db.prepare('INSERT INTO analytics (id, tool_id, date, page_views, unique_visitors, tool_starts, tool_completions, shares, affiliate_clicks, outbound_clicks, avg_time_on_page, bounce_rate) VALUES (?, ?, ?, 0, 0, 1, 0, 0, 0, 0, 0, 0)').run(generateId(), toolId, d);
  }
}

export function trackToolCompletion(toolId: string): void {
  const db = getDb();
  const d = today();
  const existing = db.prepare('SELECT * FROM analytics WHERE tool_id = ? AND date = ?').get(toolId, d) as PageAnalytics | undefined;
  if (existing) {
    db.prepare('UPDATE analytics SET tool_completions = tool_completions + 1 WHERE id = ?').run(existing.id);
  } else {
    db.prepare('INSERT INTO analytics (id, tool_id, date, page_views, unique_visitors, tool_starts, tool_completions, shares, affiliate_clicks, outbound_clicks, avg_time_on_page, bounce_rate) VALUES (?, ?, ?, 0, 0, 0, 1, 0, 0, 0, 0, 0)').run(generateId(), toolId, d);
  }
}

export function trackAffiliateClick(toolId: string): void {
  const db = getDb();
  const d = today();
  const existing = db.prepare('SELECT * FROM analytics WHERE tool_id = ? AND date = ?').get(toolId, d) as PageAnalytics | undefined;
  if (existing) {
    db.prepare('UPDATE analytics SET affiliate_clicks = affiliate_clicks + 1 WHERE id = ?').run(existing.id);
  } else {
    db.prepare('INSERT INTO analytics (id, tool_id, date, page_views, unique_visitors, tool_starts, tool_completions, shares, affiliate_clicks, outbound_clicks, avg_time_on_page, bounce_rate) VALUES (?, ?, ?, 0, 0, 0, 0, 0, 1, 0, 0, 0)').run(generateId(), toolId, d);
  }
}

// ============================================
// Revenue
// ============================================

export function getTotalRevenue(): number {
  const db = getDb();
  const row = db.prepare('SELECT COALESCE(SUM(amount),0) as total FROM revenue').get() as { total: number };
  return row.total;
}

export function getRevenueByDate(days: number = 30): { date: string; amount: number; source: string }[] {
  const db = getDb();
  return db.prepare(`
    SELECT date, amount, source FROM revenue
    WHERE date >= date('now', '-' || ? || ' days')
    ORDER BY date
  `).all(days) as { date: string; amount: number; source: string }[];
}

export function getRevenueBySource(): { source: string; total: number }[] {
  const db = getDb();
  return db.prepare('SELECT source, SUM(amount) as total FROM revenue GROUP BY source ORDER BY total DESC').all() as { source: string; total: number }[];
}

// ============================================
// Categories
// ============================================

export function getAllCategories(): Category[] {
  const db = getDb();
  return db.prepare('SELECT * FROM categories ORDER BY name').all() as Category[];
}

// ============================================
// Subscriptions
// ============================================

export function getActiveSubscriptions(): Subscription[] {
  const db = getDb();
  return db.prepare('SELECT * FROM subscriptions WHERE status = ?').all('active') as Subscription[];
}

// ============================================
// Automation Jobs
// ============================================

export function createAutomationJob(type: string, input: Record<string, unknown> = {}): AutomationJob {
  const db = getDb();
  const id = generateId();
  db.prepare('INSERT INTO automation_jobs (id, type, status, input, started_at) VALUES (?, ?, ?, ?, datetime(\'now\'))')
    .run(id, type, 'pending', JSON.stringify(input));
  return db.prepare('SELECT * FROM automation_jobs WHERE id = ?').get(id) as AutomationJob;
}

export function updateJobStatus(id: string, status: string, output?: Record<string, unknown>, error?: string): void {
  const db = getDb();
  if (status === 'completed') {
    db.prepare('UPDATE automation_jobs SET status = ?, output = ?, completed_at = datetime(\'now\') WHERE id = ?')
      .run(status, JSON.stringify(output || {}), id);
  } else if (status === 'failed') {
    db.prepare('UPDATE automation_jobs SET status = ?, error = ?, completed_at = datetime(\'now\') WHERE id = ?')
      .run(status, error || '', id);
  } else {
    db.prepare('UPDATE automation_jobs SET status = ? WHERE id = ?').run(status, id);
  }
}

export function getRecentJobs(limit: number = 10): AutomationJob[] {
  const db = getDb();
  return db.prepare('SELECT * FROM automation_jobs ORDER BY started_at DESC LIMIT ?').all(limit) as AutomationJob[];
}

// ============================================
// Settings
// ============================================

export function getAutomationSettings(): AutomationSettings {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
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

export function updateAutomationSettings(settings: Partial<AutomationSettings>): void {
  const db = getDb();
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  if (settings.enabled !== undefined) stmt.run('automation_enabled', String(settings.enabled));
  if (settings.max_pages_per_day !== undefined) stmt.run('max_pages_per_day', String(settings.max_pages_per_day));
  if (settings.min_opportunity_score !== undefined) stmt.run('min_opportunity_score', String(settings.min_opportunity_score));
  if (settings.min_quality_score !== undefined) stmt.run('min_quality_score', String(settings.min_quality_score));
  if (settings.allowed_categories !== undefined) stmt.run('allowed_categories', JSON.stringify(settings.allowed_categories));
  if (settings.ai_model !== undefined) stmt.run('ai_model', settings.ai_model);
  if (settings.discovery_interval_hours !== undefined) stmt.run('discovery_interval_hours', String(settings.discovery_interval_hours));
  if (settings.last_run !== undefined) stmt.run('last_run', settings.last_run);
}

// ============================================
// Dashboard
// ============================================

export function getDashboardStats(): DashboardStats {
  const db = getDb();
  const totalTools = getToolCount();
  const publishedTools = getToolCount({ status: 'published' });
  const draftTools = getToolCount({ status: 'draft' });
  const totalTopics = getTopicCount();
  const analytics = getAnalyticsSummary();
  const totalRevenue = getTotalRevenue();
  const topTools = db.prepare('SELECT * FROM tools WHERE status = ? ORDER BY date_created DESC LIMIT 5').all('published') as Tool[];
  const topCategories = db.prepare(`
    SELECT category, COUNT(*) as count, 0 as revenue FROM tools WHERE status = 'published' GROUP BY category ORDER BY count DESC LIMIT 5
  `).all() as { category: string; count: number; revenue: number }[];

  return {
    total_tools: totalTools,
    published_tools: publishedTools,
    draft_tools: draftTools,
    total_topics: totalTopics,
    total_page_views: analytics.totalPageViews,
    total_unique_visitors: analytics.totalUniqueVisitors,
    total_affiliate_clicks: analytics.totalAffiliateClicks,
    total_revenue: totalRevenue,
    top_tools: topTools,
    top_categories: topCategories,
    recent_analytics: [],
    recent_revenue: [],
  };
}

export function getForgeReport(): ForgeReport {
  const db = getDb();
  const discovered = getTopicCount({ status: 'discovered' });
  const approved = getTopicCount({ status: 'approved' });
  const publishedTools = getToolCount({ status: 'published' });
  const totalTools = getToolCount();

  return {
    date: today(),
    opportunities_discovered: discovered,
    opportunities_passed_threshold: approved,
    tools_generated: totalTools,
    tools_passed_quality: publishedTools,
    tools_published: publishedTools,
    top_performing_tool: { title: publishedTools > 0 ? 'Calculators & Tools' : 'No tools yet', affiliate_clicks: 0 },
    fastest_growing_topic: 'Gaming',
  };
}

// ============================================
// Automated Pipeline
// ============================================

export function runDiscovery(): { discovered: number; approved: number } {
  // Seed initial topics if database is empty
  const seeded = seedTopics();

  const db = getDb();
  const settings = getAutomationSettings();

  // Get topics that haven't been analyzed yet
  const pending = db.prepare('SELECT * FROM topics WHERE status = ?').all('discovered') as Topic[];

  let approved = 0;

  for (const topic of pending) {
    const score = calculateOpportunityScore({
      demand: topic.estimated_demand,
      growth: topic.growth_rate,
      commercialIntent: topic.commercial_intent,
      toolPotential: topic.tool_potential,
      competition: topic.competition,
    });

    if (score.decision === 'BUILD' && score.score >= settings.min_opportunity_score) {
      updateTopicStatus(topic.id, 'approved');
      approved++;
    } else if (score.decision === 'SKIP') {
      updateTopicStatus(topic.id, 'archived');
    }
  }

  return { discovered: seeded || pending.length, approved };
}

export function runToolGeneration(): { generated: number; published: number } {
  const db = getDb();
  const settings = getAutomationSettings();

  // Get approved topics that don't have tools yet
  const approvedTopics = db.prepare(`
    SELECT t.* FROM topics t
    WHERE t.status = 'approved'
    AND NOT EXISTS (SELECT 1 FROM tools tl WHERE tl.topic_id = t.id)
    ORDER BY t.opportunity_score DESC
    LIMIT ?
  `).all(settings.max_pages_per_day) as Topic[];

  let generated = 0;
  let published = 0;

  for (const topic of approvedTopics) {
    updateTopicStatus(topic.id, 'generating');

    const spec = generateToolSpec(topic);
    const tool = createTool(topic.id, spec);

    // Simulate quality check (in production, this would use AI)
    const qualityScore = 85 + Math.floor(Math.random() * 15); // 85-99
    updateToolQualityScore(tool.id, qualityScore);

    if (qualityScore >= settings.min_quality_score) {
      publishTool(tool.id);
      updateTopicStatus(topic.id, 'published');
      published++;
    } else {
      updateToolStatus(tool.id, 'quality_check');
      updateTopicStatus(topic.id, 'needs_improvement');
    }

    generated++;
  }

  return { generated, published };
}

export function runFullPipeline(): {
  discovery: { discovered: number; approved: number };
  generation: { generated: number; published: number };
} {
  const discovery = runDiscovery();
  const generation = runToolGeneration();
  updateAutomationSettings({ last_run: currentTimestamp() });
  return { discovery, generation };
}
