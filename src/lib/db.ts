// ============================================
// TREND FORGE AI — Database Layer (In-Memory JSON Store)
// Serverless-compatible — works on Vercel
// ============================================
import { v4 as uuidv4 } from 'uuid';

// Simple in-memory database that stores data in JSON objects
// Each "table" is a Map of id -> row
interface Row { [key: string]: unknown; }
type Table = Map<string, Row>;

class InMemoryDb {
  private tables: Map<string, Table> = new Map();

  private getTable(name: string): Table {
    if (!this.tables.has(name)) this.tables.set(name, new Map());
    return this.tables.get(name)!;
  }

  exec(sql: string) {
    // Parse CREATE TABLE statements
    const createMatch = sql.match(/CREATE TABLE IF NOT EXISTS (\w+) \(([\s\S]+)\)/g);
    if (createMatch) {
      for (const match of createMatch) {
        const tableName = match.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
        if (tableName) this.getTable(tableName);
      }
    }
  }

  prepare(sql: string) {
    const db = this;

    return {
      run(...params: unknown[]) {
        const upperSql = sql.trim().toUpperCase();

        // INSERT OR IGNORE
        if (upperSql.startsWith('INSERT OR IGNORE')) {
          const tableMatch = sql.match(/INSERT OR IGNORE INTO (\w+)/i);
          if (!tableMatch) return;
          const tableName = tableMatch[1];
          const table = db.getTable(tableName);

          // Parse column names from INSERT INTO table (col1, col2, ...) VALUES
          const colMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
          if (!colMatch) return;
          const cols = colMatch[1].split(',').map(c => c.trim());

          const idVal = params[0] as string;
          if (table.has(idVal)) return; // OR IGNORE — skip if exists

          const row: Row = { id: idVal };
          cols.forEach((col, i) => {
            if (i < params.length) row[col] = params[i];
          });
          table.set(idVal, row);
          return;
        }

        // INSERT
        if (upperSql.startsWith('INSERT INTO')) {
          const tableMatch = sql.match(/INSERT INTO (\w+)/i);
          if (!tableMatch) return;
          const tableName = tableMatch[1];
          const table = db.getTable(tableName);

          const colMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
          if (!colMatch) return;
          const cols = colMatch[1].split(',').map(c => c.trim());

          const row: Row = {};
          cols.forEach((col, i) => {
            if (i < params.length) row[col] = params[i];
          });

          const id = row.id as string || uuidv4();
          row.id = id;
          table.set(id, row);
          return;
        }

        // INSERT OR REPLACE
        if (upperSql.startsWith('INSERT OR REPLACE')) {
          const tableMatch = sql.match(/INSERT OR REPLACE INTO (\w+)/i);
          if (!tableMatch) return;
          const tableName = tableMatch[1];
          const table = db.getTable(tableName);

          const colMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
          if (!colMatch) return;
          const cols = colMatch[1].split(',').map(c => c.trim());

          const row: Row = {};
          cols.forEach((col, i) => {
            if (i < params.length) row[col] = params[i];
          });

          const id = row.id as string || row.key as string || uuidv4();
          row.id = id;
          table.set(id, row);
          return;
        }

        // UPDATE
        if (upperSql.startsWith('UPDATE')) {
          const tableMatch = sql.match(/UPDATE (\w+)/i);
          if (!tableMatch) return;
          const tableName = tableMatch[1];
          const table = db.getTable(tableName);

          // Find SET assignments
          const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
          if (!setMatch) return;
          const setParts = setMatch[1].split(',').map(s => s.trim().split('=').map(x => x.trim()));

          // Find WHERE condition
          const whereMatch = sql.match(/WHERE\s+(.+)/i);
          if (!whereMatch) return;
          const whereParts = whereMatch[1].split('AND').map(s => {
            const [col, op, ...rest] = s.trim().split(/\s+/);
            return { col, op, val: rest.join(' ') };
          });

          let paramIdx = 0;
          // Map SET values from params
          const setValues: unknown[] = [];
          setParts.forEach(() => { setValues.push(params[paramIdx++]); });

          // Find which params are for WHERE
          const whereValues = params.slice(paramIdx);

          for (const [, row] of table) {
            let match = true;
            for (let i = 0; i < whereParts.length; i++) {
              const wp = whereParts[i];
              const whereParam = wp.val === '?' ? whereValues[i] : undefined;
              if (whereParam !== undefined && row[wp.col] !== whereParam) {
                match = false;
                break;
              }
            }
            if (match) {
              setParts.forEach((part, i) => {
                const col = part[0];
                // Handle expressions like "page_views = page_views + 1"
                if (setValues[i] !== undefined) {
                  row[col] = setValues[i];
                }
              });
            }
          }
          return;
        }

        // DELETE
        if (upperSql.startsWith('DELETE')) {
          const tableMatch = sql.match(/DELETE FROM (\w+)/i);
          if (!tableMatch) return;
          const tableName = tableMatch[1];
          const table = db.getTable(tableName);
          const whereMatch = sql.match(/WHERE\s+(.+)/i);
          if (!whereMatch) return;
          const [col] = whereMatch[1].split('=')[0].trim().split(/\s+/);
          const val = params[0];
          for (const [id, row] of table) {
            if (row[col] === val) { table.delete(id); break; }
          }
          return;
        }
      },

      get(...params: unknown[]): Row | undefined {
        const upperSql = sql.trim().toUpperCase();

        // SELECT COUNT(*) 
        if (upperSql.includes('COUNT(*)')) {
          const tableMatch = sql.match(/FROM (\w+)/i);
          if (!tableMatch) return { count: 0 };
          const tableName = tableMatch[1];
          const table = db.getTable(tableName);

          const whereMatch = sql.match(/WHERE\s+(.+)/i);
          let count = 0;
          if (whereMatch) {
            const parts = whereMatch[1].split('AND').map(s => {
              const segs = s.trim().split(/\s+/);
              return { col: segs[0], val: params[segs.indexOf('?') >= 0 ? params.indexOf(params[segs.indexOf('?')]) : 0] };
            });
            // Simple: just count by status filter
            const statusParam = params.find(p => typeof p === 'string' && !p.includes('{'));
            for (const [, row] of table) {
              if (statusParam && row.status !== statusParam) continue;
              count++;
            }
          } else {
            count = table.size;
          }
          return { count } as Row;
        }

        // SELECT COALESCE(SUM(...))
        if (upperSql.includes('COALESCE(SUM(')) {
          const tableMatch = sql.match(/FROM (\w+)/i);
          if (!tableMatch) return {};
          const tableName = tableMatch[1];
          const table = db.getTable(tableName);
          const sumColMatch = sql.match(/SUM\((\w+(?:\.\w+)?)\)/i);
          const sumCol = sumColMatch ? sumColMatch[1].split('.').pop()! : 'amount';
          const avgMatch = sql.match(/AVG\((\w+(?:\.\w+)?)\)/i);

          let sum = 0;
          let count = 0;
          for (const [, row] of table) {
            sum += Number(row[sumCol]) || 0;
            if (avgMatch) count++;
          }

          const result: Row = {};
          result.totalPageViews = 0;
          result.totalUniqueVisitors = 0;
          result.totalToolStarts = 0;
          result.totalToolCompletions = 0;
          result.totalShares = 0;
          result.totalAffiliateClicks = 0;
          result.avgBounceRate = 0;
          result.total = sum;

          // Parse all COALESCE fields
          const coalesceMatches = [...sql.matchAll(/COALESCE\((?:SUM|AVG)\((\w+(?:\.\w+)?)\),0\)\s+as\s+(\w+)/gi)];
          for (const m of coalesceMatches) {
            const col = m[1].split('.').pop()!;
            const alias = m[2];
            let val = 0;
            if (m[0].includes('AVG')) {
              let total = 0; let cnt = 0;
              for (const [, row] of table) { total += Number(row[col]) || 0; cnt++; }
              val = cnt > 0 ? total / cnt : 0;
            } else {
              for (const [, row] of table) { val += Number(row[col]) || 0; }
            }
            result[alias] = val;
          }

          return result;
        }

        // SELECT simple single row
        const tableMatch = sql.match(/FROM (\w+)/i);
        if (!tableMatch) return undefined;
        const tableName = tableMatch[1];
        const table = db.getTable(tableName);

        const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i);
        if (!whereMatch) {
          const first = table.values().next().value;
          return first;
        }

        const whereClause = whereMatch[1];
        // Handle subqueries (NOT EXISTS)
        if (whereClause.includes('NOT EXISTS')) {
          const rows = [...table.values()];
          const approved = rows.filter(r => r.status === 'approved');
          return approved[0];
        }

        const conditions = whereClause.split(/\s+AND\s+/i);
        for (const [, row] of table) {
          let match = true;
          let pi = 0;
          for (const cond of conditions) {
            const parts = cond.trim().split(/\s+/);
            const col = parts[0];
            const val = parts[2] === '?' ? params[pi++] : parts.slice(2).join(' ').replace(/'/g, '');
            if (val !== undefined && String(row[col]) !== String(val)) { match = false; break; }
          }
          if (match) return row;
        }
        return undefined;
      },

      all(...params: unknown[]): Row[] {
        const upperSql = sql.trim().toUpperCase();
        const tableMatch = sql.match(/FROM (\w+)/i);
        if (!tableMatch) return [];
        const tableName = tableMatch[1];
        const table = db.getTable(tableName);

        let rows = [...table.values()];

        // WHERE
        const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+GROUP|\s+ORDER|\s+LIMIT|$)/i);
        if (whereMatch && !whereMatch[1].includes('NOT EXISTS')) {
          const conditions = whereMatch[1].split(/\s+AND\s+/i);
          rows = rows.filter(row => {
            let pi = 0;
            for (const cond of conditions) {
              const parts = cond.trim().split(/\s+/);
              const col = parts[0];
              const val = parts[2] === '?' ? params[pi++] : parts.slice(2).join(' ').replace(/'/g, '');
              if (val !== undefined && String(row[col]) !== String(val)) return false;
            }
            return true;
          });
        }

        // GROUP BY
        const groupMatch = sql.match(/GROUP BY\s+(\w+)/i);
        if (groupMatch) {
          const groupCol = groupMatch[1];
          const groups = new Map<string, Row[]>();
          for (const row of rows) {
            const key = String(row[groupCol] || 'null');
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(row);
          }
          rows = [];
          for (const [, groupRows] of groups) {
            const aggregated: Row = { ...groupRows[0] };
            // COUNT
            const countMatch = sql.match(/COUNT\(\*?\w?\*?\)\s+as\s+(\w+)/i);
            if (countMatch) aggregated[countMatch[1]] = groupRows.length;
            rows.push(aggregated);
          }
        }

        // ORDER BY
        const orderMatch = sql.match(/ORDER BY\s+(\w+(?:\.\w+)?)(?:\s+(ASC|DESC))?/i);
        if (orderMatch) {
          const col = orderMatch[1].split('.').pop()!;
          const desc = orderMatch[2]?.toUpperCase() === 'DESC';
          rows.sort((a, b) => {
            const va = Number(a[col]) || 0;
            const vb = Number(b[col]) || 0;
            return desc ? vb - va : va - vb;
          });
        }

        // LIMIT
        const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
        if (limitMatch) {
          rows = rows.slice(0, parseInt(limitMatch[1]));
        }

        return rows;
      },
    };
  }
}

let _db: InMemoryDb | null = null;

export async function getDb(): Promise<InMemoryDb> {
  if (_db) return _db;
  _db = new InMemoryDb();
  initializeDatabase(_db);
  return _db;
}

function initializeDatabase(db: InMemoryDb) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS topics (id TEXT, topic TEXT, slug TEXT, category TEXT,
      trend_score REAL, growth_rate REAL, estimated_demand REAL, commercial_intent REAL,
      competition REAL, tool_potential REAL, opportunity_score REAL, related_keywords TEXT,
      status TEXT, source TEXT, date_discovered TEXT, date_updated TEXT);
    CREATE TABLE IF NOT EXISTS tools (id TEXT, topic_id TEXT, title TEXT, slug TEXT,
      description TEXT, tool_type TEXT, category TEXT, content TEXT, inputs_schema TEXT,
      outputs_schema TEXT, meta_title TEXT, meta_description TEXT, canonical_url TEXT,
      og_image TEXT, structured_data TEXT, quality_score REAL, status TEXT, version INTEGER,
      affiliate_links TEXT, related_tools TEXT, date_created TEXT, date_published TEXT,
      date_updated TEXT);
    CREATE TABLE IF NOT EXISTS analytics (id TEXT, tool_id TEXT, date TEXT, page_views INTEGER,
      unique_visitors INTEGER, tool_starts INTEGER, tool_completions INTEGER, shares INTEGER,
      affiliate_clicks INTEGER, outbound_clicks INTEGER, avg_time_on_page REAL, bounce_rate REAL);
    CREATE TABLE IF NOT EXISTS revenue (id TEXT, date TEXT, source TEXT, amount REAL,
      currency TEXT, tool_id TEXT, details TEXT);
    CREATE TABLE IF NOT EXISTS affiliate_links (id TEXT, tool_id TEXT, product_name TEXT,
      product_url TEXT, affiliate_url TEXT, network TEXT, category TEXT, price REAL,
      clicks INTEGER, conversions INTEGER, revenue REAL, created_at TEXT);
    CREATE TABLE IF NOT EXISTS users (id TEXT, email TEXT, name TEXT, plan TEXT,
      password_hash TEXT, created_at TEXT);
    CREATE TABLE IF NOT EXISTS saved_tools (id TEXT, user_id TEXT, tool_id TEXT,
      result TEXT, saved_at TEXT);
    CREATE TABLE IF NOT EXISTS automation_jobs (id TEXT, type TEXT, status TEXT,
      input TEXT, output TEXT, error TEXT, started_at TEXT, completed_at TEXT);
    CREATE TABLE IF NOT EXISTS subscriptions (id TEXT, email TEXT, status TEXT,
      subscribed_at TEXT, unsubscribed_at TEXT);
    CREATE TABLE IF NOT EXISTS categories (id TEXT, name TEXT, slug TEXT, icon TEXT,
      auto_discovered INTEGER, tools_count INTEGER);
    CREATE TABLE IF NOT EXISTS settings (key TEXT, value TEXT);
  `);

  seedDefaultCategories(db);
  seedDefaultSettings(db);
}

function seedDefaultCategories(db: InMemoryDb) {
  const cats = [
    ['Technology', 'technology', '💻'], ['AI', 'ai', '🤖'], ['Gaming', 'gaming', '🎮'],
    ['Education', 'education', '📚'], ['Finance', 'finance', '💰'], ['Shopping', 'shopping', '🛒'],
    ['Fitness', 'fitness', '💪'], ['Travel', 'travel', '✈️'], ['Home', 'home', '🏠'],
    ['Cars', 'cars', '🚗'], ['Entertainment', 'entertainment', '🎬'],
    ['Productivity', 'productivity', '⚡'], ['Business', 'business', '💼'],
    ['Career', 'career', '📈'], ['Lifestyle', 'lifestyle', '🌟'],
  ];
  for (const [name, slug, icon] of cats) {
    db.prepare('INSERT OR IGNORE INTO categories (id, name, slug, icon, auto_discovered, tools_count) VALUES (?, ?, ?, ?, 0, 0)')
      .run(uuidv4(), name, slug, icon);
  }
}

function seedDefaultSettings(db: InMemoryDb) {
  const defaults: Record<string, string> = {
    automation_enabled: 'true', max_pages_per_day: '10', min_opportunity_score: '70',
    min_quality_score: '85',
    allowed_categories: JSON.stringify(['technology','gaming','education','finance','shopping','fitness','travel','home','cars','entertainment','productivity','business','career','lifestyle','ai']),
    ai_model: 'gpt-4', discovery_interval_hours: '6',
  };
  for (const [key, value] of Object.entries(defaults)) {
    db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run(key, value);
  }
}

export function generateId(): string {
  return uuidv4();
}
