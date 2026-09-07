import React, { useEffect, useState } from 'react';
import { Database, ShieldCheck, AlertCircle } from 'lucide-react';

export default function Evidence() {
  const [ledgers, setLedgers] = useState<{caseId: string, blocks: any[]}[]>([]);
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState<{ verified: boolean, blockCount: number } | null>(null);

  useEffect(() => {
    // Fetch all cases, then fetch their ledgers
    fetch('/api/cases')
      .then(res => res.json())
      .then(async (cases) => {
         const allLedgers = await Promise.all(cases.map(async (c: any) => {
            const res = await fetch(`/api/evidence/${c.id}`);
            const blocks = await res.json();
            return { caseId: c.id, blocks };
         }));
         setLedgers(allLedgers);
         setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const verifyIntegrity = async () => {
    try {
       const res = await fetch('/api/evidence/verify', { method: 'POST' });
       const data = await res.json();
       setVerification(data);
    } catch (err) {
       console.error(err);
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Evidence Ledger</h2>
          <p className="text-slate-500 mt-1">Cryptographic chain-of-custody for all forensic artifacts.</p>
        </div>
        <button 
          onClick={verifyIntegrity}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-[0_0_15px_rgba(37,99,235,0.2)]"
        >
          VERIFY INTEGRITY
        </button>
      </div>

      {verification && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${verification.verified ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {verification.verified ? <ShieldCheck className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          <div>
            <div className="font-bold">{verification.verified ? '✓ INTEGRITY VERIFIED' : '✕ INTEGRITY COMPROMISED'}</div>
            <div className="text-sm opacity-80">
              {verification.verified 
                ? `Evidence has not been modified. Verified ${verification.blockCount} blocks.` 
                : 'Evidence hash does not match expected sequence.'}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading ledger...</div>
      ) : ledgers.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
          No evidence records found.
        </div>
      ) : (
        <div className="space-y-6">
          {ledgers.map((ledger) => (
             <div key={ledger.caseId} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
               <div className="bg-slate-950/50 p-4 border-b border-slate-800">
                 <h3 className="font-medium text-slate-200 flex items-center gap-2">
                   <Database className="w-4 h-4 text-blue-500" />
                   Ledger: {ledger.caseId}
                 </h3>
               </div>
               <div className="p-4 space-y-4">
                 {ledger.blocks.map((block: any, idx: number) => (
                    <div key={idx} className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-[-16px] before:w-[2px] before:bg-slate-800 last:before:hidden">
                       <div className="absolute left-0 top-1.5 w-[24px] h-[24px] bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400 ring-4 ring-slate-900">
                         {String(block.sequence).padStart(2, '0')}
                       </div>
                       <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg ml-2">
                         <div className="flex justify-between items-start mb-2">
                           <span className="font-medium text-slate-200">{block.eventType}</span>
                           <span className="text-xs text-slate-500">{new Date(block.timestamp).toLocaleString()}</span>
                         </div>
                         <div className="space-y-1 text-xs font-mono text-slate-400 break-all">
                           <div><span className="text-slate-500">PREV HASH:</span> {block.previousHash}</div>
                           <div><span className="text-slate-500">CURR HASH:</span> <span className="text-blue-400">{block.currentHash}</span></div>
                         </div>
                       </div>
                    </div>
                 ))}
               </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}
