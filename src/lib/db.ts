// ============================================
// TREND FORGE AI — Database Layer (SQLite)
// ============================================
import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DB_PATH = path.join(process.cwd(), 'trendforge.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initializeDatabase(_db);
  }
  return _db;
}

function initializeDatabase(db: Database.Database) {
  db.exec(`
    -- Topics / Opportunities
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      topic TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      trend_score REAL DEFAULT 0,
      growth_rate REAL DEFAULT 0,
      estimated_demand REAL DEFAULT 0,
      commercial_intent REAL DEFAULT 0,
      competition REAL DEFAULT 0,
      tool_potential REAL DEFAULT 0,
      opportunity_score REAL DEFAULT 0,
      related_keywords TEXT DEFAULT '[]',
      status TEXT DEFAULT 'discovered',
      source TEXT DEFAULT 'manual',
      date_discovered TEXT DEFAULT (datetime('now')),
      date_updated TEXT DEFAULT (datetime('now'))
    );

    -- Tools / Pages
    CREATE TABLE IF NOT EXISTS tools (
      id TEXT PRIMARY KEY,
      topic_id TEXT REFERENCES topics(id),
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      tool_type TEXT DEFAULT 'calculator',
      category TEXT DEFAULT 'general',
      content TEXT DEFAULT '',
      inputs_schema TEXT DEFAULT '{}',
      outputs_schema TEXT DEFAULT '{}',
      meta_title TEXT DEFAULT '',
      meta_description TEXT DEFAULT '',
      canonical_url TEXT DEFAULT '',
      og_image TEXT DEFAULT '',
      structured_data TEXT DEFAULT '{}',
      quality_score REAL DEFAULT 0,
      status TEXT DEFAULT 'draft',
      version INTEGER DEFAULT 1,
      affiliate_links TEXT DEFAULT '[]',
      related_tools TEXT DEFAULT '[]',
      date_created TEXT DEFAULT (datetime('now')),
      date_published TEXT DEFAULT '',
      date_updated TEXT DEFAULT (datetime('now'))
    );

    -- Page Analytics
    CREATE TABLE IF NOT EXISTS analytics (
      id TEXT PRIMARY KEY,
      tool_id TEXT REFERENCES tools(id),
      date TEXT NOT NULL,
      page_views INTEGER DEFAULT 0,
      unique_visitors INTEGER DEFAULT 0,
      tool_starts INTEGER DEFAULT 0,
      tool_completions INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      affiliate_clicks INTEGER DEFAULT 0,
      outbound_clicks INTEGER DEFAULT 0,
      avg_time_on_page REAL DEFAULT 0,
      bounce_rate REAL DEFAULT 0
    );

    -- Revenue
    CREATE TABLE IF NOT EXISTS revenue (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      source TEXT DEFAULT 'affiliate',
      amount REAL DEFAULT 0,
      currency TEXT DEFAULT 'USD',
      tool_id TEXT,
      details TEXT DEFAULT '{}'
    );

    -- Affiliate Links
    CREATE TABLE IF NOT EXISTS affiliate_links (
      id TEXT PRIMARY KEY,
      tool_id TEXT REFERENCES tools(id),
      product_name TEXT NOT NULL,
      product_url TEXT DEFAULT '',
      affiliate_url TEXT DEFAULT '',
      network TEXT DEFAULT '',
      category TEXT DEFAULT '',
      price REAL DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      revenue REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT DEFAULT '',
      plan TEXT DEFAULT 'free',
      password_hash TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Saved Tools
    CREATE TABLE IF NOT EXISTS saved_tools (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      tool_id TEXT REFERENCES tools(id),
      result TEXT DEFAULT '{}',
      saved_at TEXT DEFAULT (datetime('now'))
    );

    -- Automation Jobs
    CREATE TABLE IF NOT EXISTS automation_jobs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      input TEXT DEFAULT '{}',
      output TEXT DEFAULT '{}',
      error TEXT DEFAULT '',
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT DEFAULT ''
    );

    -- Subscriptions
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'active',
      subscribed_at TEXT DEFAULT (datetime('now')),
      unsubscribed_at TEXT DEFAULT ''
    );

    -- Categories
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT DEFAULT '📁',
      auto_discovered INTEGER DEFAULT 0,
      tools_count INTEGER DEFAULT 0
    );

    -- Automation Settings
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status);
    CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category);
    CREATE INDEX IF NOT EXISTS idx_topics_opportunity_score ON topics(opportunity_score DESC);
    CREATE INDEX IF NOT EXISTS idx_tools_slug ON tools(slug);
    CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(status);
    CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
    CREATE INDEX IF NOT EXISTS idx_analytics_tool_id ON analytics(tool_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date);
    CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue(date);
    CREATE INDEX IF NOT EXISTS idx_revenue_source ON revenue(source);
    CREATE INDEX IF NOT EXISTS idx_affiliate_links_tool_id ON affiliate_links(tool_id);
    CREATE INDEX IF NOT EXISTS idx_automation_jobs_status ON automation_jobs(status);
  `);

  // Seed default categories
  seedDefaultCategories(db);
  // Seed default settings
  seedDefaultSettings(db);
}

function seedDefaultCategories(db: Database.Database) {
  const categories = [
    { name: 'Technology', slug: 'technology', icon: '💻' },
    { name: 'AI', slug: 'ai', icon: '🤖' },
    { name: 'Gaming', slug: 'gaming', icon: '🎮' },
    { name: 'Education', slug: 'education', icon: '📚' },
    { name: 'Finance', slug: 'finance', icon: '💰' },
    { name: 'Shopping', slug: 'shopping', icon: '🛒' },
    { name: 'Fitness', slug: 'fitness', icon: '💪' },
    { name: 'Travel', slug: 'travel', icon: '✈️' },
    { name: 'Home', slug: 'home', icon: '🏠' },
    { name: 'Cars', slug: 'cars', icon: '🚗' },
    { name: 'Entertainment', slug: 'entertainment', icon: '🎬' },
    { name: 'Productivity', slug: 'productivity', icon: '⚡' },
    { name: 'Business', slug: 'business', icon: '💼' },
    { name: 'Career', slug: 'career', icon: '📈' },
    { name: 'Lifestyle', slug: 'lifestyle', icon: '🌟' },
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO categories (id, name, slug, icon, auto_discovered, tools_count)
    VALUES (?, ?, ?, ?, 0, 0)
  `);

  for (const cat of categories) {
    stmt.run(uuidv4(), cat.name, cat.slug, cat.icon);
  }
}

function seedDefaultSettings(db: Database.Database) {
  const defaults: Record<string, string> = {
    automation_enabled: 'true',
    max_pages_per_day: '10',
    min_opportunity_score: '70',
    min_quality_score: '85',
    allowed_categories: JSON.stringify([
      'technology', 'gaming', 'education', 'finance', 'shopping',
      'fitness', 'travel', 'home', 'cars', 'entertainment',
      'productivity', 'business', 'career', 'lifestyle', 'ai'
    ]),
    ai_model: 'gpt-4',
    discovery_interval_hours: '6',
  };

  const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(defaults)) {
    stmt.run(key, value);
  }
}

// ---- Helper functions ----

export function generateId(): string {
  return uuidv4();
}

export function getSetting(key: string): string | null {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  const db = getDb();
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}
