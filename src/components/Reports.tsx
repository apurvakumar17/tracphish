import React, { useEffect, useState } from 'react';
import { FileText, Download, Clock } from 'lucide-react';
import { Case } from '../types';

export default function Reports() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cases')
      .then(res => res.json())
      .then(data => {
        setCases(data);
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
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Forensic Reports</h2>
        <p className="text-slate-500 mt-1">Downloadable chain-of-custody and analysis reports.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 font-medium">Report / Case ID</th>
              <th className="px-6 py-4 font-medium">Threat Type</th>
              <th className="px-6 py-4 font-medium">Generated</th>
              <th className="px-6 py-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading reports...</td></tr>
            ) : cases.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No reports generated yet. Analyze an email to create a case.</td></tr>
            ) : cases.map((c) => (
              <tr key={c.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="font-medium text-slate-200">Report_{c.id}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{c.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-300">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                      c.severity === 'Critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      c.severity === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {c.threatClassification}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400 flex items-center gap-2">
                   <Clock className="w-4 h-4" /> {new Date(c.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-3">
                     <a
                        href={`/api/report/${c.id}`}
                        download={`Forensic_Report_${c.id}.txt`}
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
                     >
                        <Download className="w-4 h-4" /> Download
                     </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
