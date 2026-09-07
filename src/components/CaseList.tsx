import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Case } from '../types';
import { Search, Filter } from 'lucide-react';

export default function CaseList() {
  const [cases, setCases] = useState<Case[]>([]);

  useEffect(() => {
    fetch('/api/cases')
      .then(res => res.json())
      .then(data => setCases(data))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Investigation Cases</h2>
          <p className="text-slate-500 mt-1">Manage and review forensic email analyses.</p>
        </div>
        
        <div className="flex gap-3">
           <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search cases..." 
                className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors w-64"
              />
           </div>
           <button className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-2 text-sm">
             <Filter className="w-4 h-4" />
             Filter
           </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-950/80 sticky top-0 text-slate-400 border-b border-slate-800 backdrop-blur z-10">
              <tr>
                <th className="px-6 py-4 font-medium">Case ID</th>
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Severity</th>
                <th className="px-6 py-4 font-medium">Threat Score</th>
                <th className="px-6 py-4 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-blue-400 group-hover:text-blue-300">
                    <Link to={`/cases/${c.id}`}>{c.id}</Link>
                  </td>
                  <td className="px-6 py-4 text-slate-200 font-medium truncate max-w-[300px]">
                    <Link to={`/cases/${c.id}`}>{c.title}</Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-400">{c.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
                      c.severity === 'Critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      c.severity === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {c.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-300">
                    {c.threatScore} / 100
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {cases.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No cases available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
