'use client';

import { useState, useEffect } from 'react';
import { Save, Shield, Bot, DollarSign, Globe } from 'lucide-react';

interface Category { id: string; name: string; slug: string; icon: string; }
interface AutomationSettings {
  enabled: boolean; max_pages_per_day: number; min_opportunity_score: number;
  min_quality_score: number; allowed_categories: string[]; ai_model: string;
  discovery_interval_hours: number; last_run?: string;
}

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(d => {
      setCategories(d.categories || []);
      setSettings(d.settings);
    });
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!settings) return <div className="max-w-4xl mx-auto space-y-4"><div className="h-32 bg-muted rounded-xl animate-pulse" /><div className="h-64 bg-muted rounded-xl animate-pulse" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure TrendForge AI</p>
        </div>
        <button onClick={handleSave} className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90">
          <Save className="h-4 w-4" /> {saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* AI Configuration */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> AI Configuration</h3>
        <p className="text-sm text-muted-foreground">Configure the AI model used for content generation.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="calc-label">AI Model</label>
            <select value={settings.ai_model} onChange={e => setSettings({ ...settings, ai_model: e.target.value })} className="calc-input">
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
            </select>
          </div>
          <div>
            <label className="calc-label">OpenAI API Key</label>
            <input type="password" placeholder="Set via OPENAI_API_KEY env var" className="calc-input" disabled />
          </div>
        </div>
      </div>

      {/* Monetization */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2"><DollarSign className="h-5 w-5 text-green-500" /> Monetization</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="calc-label">Affiliate Network ID</label>
            <input type="text" placeholder="Amazon Associates ID" className="calc-input" />
          </div>
          <div>
            <label className="calc-label">Ad Provider</label>
            <select className="calc-input" defaultValue="">
              <option value="" disabled>Select ad provider</option>
              <option value="adsense">Google AdSense</option>
              <option value="mediavine">Mediavine</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          Configure via environment variables: <code>OPENAI_API_KEY</code>, <code>AFFILIATE_AMAZON_ID</code>, <code>GOOGLE_ADSENSE_ID</code>, <code>STRIPE_SECRET_KEY</code>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Globe className="h-5 w-5 text-accent" /> Allowed Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map(cat => {
            const allowed = settings.allowed_categories.includes(cat.slug);
            return (
              <label key={cat.id} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${allowed ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'}`}>
                <input type="checkbox" checked={allowed}
                  onChange={e => {
                    const newCats = e.target.checked ? [...settings.allowed_categories, cat.slug] : settings.allowed_categories.filter(c => c !== cat.slug);
                    setSettings({ ...settings, allowed_categories: newCats });
                  }}
                  className="h-4 w-4 rounded text-primary" />
                <span className="text-sm">{cat.icon} {cat.name}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Safety */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Shield className="h-5 w-5 text-red-500" /> Safety Controls</h3>
        <div className="space-y-3">
          {['Block medical/health diagnosis content','Block weapons/instructional content','Block fraudulent/deceptive content','Require human review for financial content','Block hate/discriminatory content'].map((rule, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm text-foreground">{rule}</span>
              <span className="text-xs text-green-600 ml-auto">Always On</span>
            </div>
          ))}
        </div>
      </div>

      {/* Env Vars */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-foreground">Environment Variables</h3>
        <div className="bg-[#1e293b] rounded-xl p-4 font-mono text-sm text-green-400 overflow-x-auto">
          <pre>{`# AI\nOPENAI_API_KEY=sk-...\n\n# Auth\nNEXTAUTH_SECRET=your-secret\nNEXTAUTH_URL=https://yourdomain.com\n\n# Affiliate\nAFFILIATE_AMAZON_ID=your-id-20\n\n# Ads\nGOOGLE_ADSENSE_ID=pub-xxx\n\n# Subscriptions\nSTRIPE_SECRET_KEY=sk_live_...`}</pre>
        </div>
      </div>
    </div>
  );
}
