'use client';

import { useState, useEffect } from 'react';
import { Zap, Play, Pause, Clock, CheckCircle2, XCircle, Settings, RefreshCw } from 'lucide-react';
import type { AutomationSettings, AutomationJob } from '@/lib/types';

export default function AutomationPage() {
  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [jobs, setJobs] = useState<AutomationJob[]>([]);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const fetchData = () => {
    fetch('/api/pipeline').then(r => r.json()).then(d => setSettings(d.settings));
    fetch('/api/admin/settings').then(r => r.json()).then(d => setSettings(d.settings));
  };

  useEffect(() => { fetchData(); }, []);

  const handleRunPipeline = async () => {
    setRunning(true);
    setLastResult(null);
    try {
      // Auto-enable if disabled
      if (settings && !settings.enabled) {
        await fetch('/api/pipeline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'enable' }) });
      }
      const res = await fetch('/api/pipeline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'full' }) });
      const text = await res.text();
      let data: Record<string, unknown>;
      try { data = JSON.parse(text); } catch { data = { error: text || 'Empty response (status ' + res.status + ')' }; }
      if (res.ok && data.ok) {
        const r = data.result as { discovery: { discovered: number; approved: number }; generation: { generated: number; published: number } };
        const d = r.discovery;
        const g = r.generation;
        if (d.discovered === 0 && g.generated === 0) {
          setLastResult('⚠️ Pipeline ran but found no new opportunities. All topics may already be processed. Go to Opportunities and reset some to "discovered" to try again.');
        } else {
          setLastResult(`✅ Pipeline completed! Discovered ${d.discovered} opportunities, ${d.approved} approved. Generated ${g.generated} tools, ${g.published} published.`);
        }
      } else {
        const errMsg = data.error || data.message || JSON.stringify(data);
        setLastResult('❌ ' + errMsg);
      }
      fetchData();
    } catch (e) {
      setLastResult('❌ Pipeline error: ' + String(e));
    }
    setRunning(false);
  };

  const handleToggle = async () => {
    if (!settings) return;
    await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !settings.enabled }) });
    fetchData();
  };

  const handleSettingChange = async (key: string, value: unknown) => {
    await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [key]: value }) });
    fetchData();
  };

  const handleResetTopics = async () => {
    setRunning(true);
    setLastResult('Resetting topics...');
    try {
      const res = await fetch('/api/pipeline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reset' }) });
      const data = await res.json();
      if (data.ok) {
        setLastResult(`✅ Reset ${data.reset} topics back to discovered. Click "Run Full Pipeline" to process them again.`);
      } else {
        setLastResult('❌ ' + (data.error || 'Reset failed'));
      }
      fetchData();
    } catch (e) {
      setLastResult('❌ Reset error: ' + String(e));
    }
    setRunning(false);
  };

  if (!settings) return <div className="space-y-4"><div className="h-32 bg-muted rounded-xl animate-pulse" /><div className="h-64 bg-muted rounded-xl animate-pulse" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Automation</h1>
          <p className="text-muted-foreground mt-1">Control the Forge autonomous pipeline</p>
        </div>
        <button onClick={handleRunPipeline} disabled={running}
          className="px-5 py-2.5 bg-gradient-to-r from-primary to-accent text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50">
          <Play className="h-4 w-4" /> {running ? 'Running...' : 'Run Full Pipeline'}
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Automation Status</h3>
          <button onClick={handleToggle} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${settings.enabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {settings.enabled ? <><Pause className="h-4 w-4" /> Enabled</> : <><Play className="h-4 w-4" /> Disabled</>}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[{ step: '1. Discover', icon: '🔍' }, { step: '2. Score', icon: '📊' }, { step: '3. Generate', icon: '🛠️' }, { step: '4. Quality', icon: '✅' }, { step: '5. Publish', icon: '🚀' }].map((s, i) => (
            <div key={i} className="p-3 bg-muted/50 rounded-xl text-center">
              <span className="text-2xl">{s.icon}</span>
              <p className="text-sm font-medium text-foreground mt-1">{s.step}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-bold text-foreground flex items-center gap-2 mb-4"><Settings className="h-5 w-5 text-primary" /> Pipeline Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="calc-label">Maximum Pages Per Day</label>
            <input type="number" value={settings.max_pages_per_day} onChange={e => handleSettingChange('max_pages_per_day', parseInt(e.target.value))} className="calc-input" min={1} max={100} />
          </div>
          <div>
            <label className="calc-label">Minimum Opportunity Score</label>
            <input type="number" value={settings.min_opportunity_score} onChange={e => handleSettingChange('min_opportunity_score', parseInt(e.target.value))} className="calc-input" min={0} max={100} />
          </div>
          <div>
            <label className="calc-label">Minimum Quality Score</label>
            <input type="number" value={settings.min_quality_score} onChange={e => handleSettingChange('min_quality_score', parseInt(e.target.value))} className="calc-input" min={0} max={100} />
          </div>
          <div>
            <label className="calc-label">Discovery Interval (hours)</label>
            <input type="number" value={settings.discovery_interval_hours} onChange={e => handleSettingChange('discovery_interval_hours', parseInt(e.target.value))} className="calc-input" min={1} max={168} />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Recent Jobs</h3>
          <button onClick={handleResetTopics} className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200">
            Reset Topics & Re-run
          </button>
        </div>
        {lastResult && (
          <div className="p-4 bg-muted rounded-xl mb-4 text-sm whitespace-pre-wrap">{lastResult}</div>
        )}
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p>Run the pipeline to create your first automation jobs</p>
        </div>
      </div>
    </div>
  );
}
