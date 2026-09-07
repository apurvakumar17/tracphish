import React, { useEffect, useState } from 'react';
import { Database, ShieldAlert, Activity, ArrowUpRight } from 'lucide-react';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/campaigns')
      .then(res => res.json())
      .then(data => {
        setCampaigns(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Campaign Intelligence</h2>
        <p className="text-slate-500 mt-1">Correlated threat actors and ongoing attack campaigns.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
          No active campaigns detected.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campaigns.map((c) => (
            <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1 block">Active Campaign</span>
                    <h3 className="text-xl font-bold text-slate-100">{c.name}</h3>
                    <div className="text-sm text-slate-400 font-mono mt-1">{c.id}</div>
                  </div>
                  <div className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded text-sm font-medium">
                    {c.threatType}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                    <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Emails</div>
                    <div className="text-2xl font-bold text-slate-200">{c.emails}</div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                    <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Domains</div>
                    <div className="text-2xl font-bold text-slate-200">{c.domains}</div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                    <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">IPs</div>
                    <div className="text-2xl font-bold text-slate-200">{c.ips}</div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                    <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Risk Score</div>
                    <div className="text-2xl font-bold text-red-400">{c.riskScore}</div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-sm">
                  <span className="text-slate-500">First seen: {new Date(c.firstSeen).toLocaleDateString()}</span>
                  <button className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
                    Explore Graph <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
