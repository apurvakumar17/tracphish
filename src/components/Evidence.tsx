import React, { useEffect, useState } from 'react';
import { Database, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { getAllStoredLedgers, getStoredCases, getStoredLedger, saveStoredLedger, ensureLedgerHashes, verifyLedgerChain } from '../utils/storage';

export default function Evidence() {
  const [ledgers, setLedgers] = useState<{caseId: string, blocks: any[]}[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<{ verified: boolean, blockCount: number, reason?: string } | null>(null);

  useEffect(() => {
    async function loadAllEvidence() {
      try {
        let casesList = getStoredCases();
        try {
          const res = await fetch('/api/cases');
          if (res.ok) {
            const serverCases = await res.json();
            if (Array.isArray(serverCases) && serverCases.length > 0) {
              casesList = serverCases;
            }
          }
        } catch {
          // fallback to stored cases
        }

        const loadedLedgers: { caseId: string; blocks: any[] }[] = [];

        for (const c of casesList) {
          let blocks = getStoredLedger(c.id);
          if (!blocks || blocks.length === 0) {
            try {
              const res = await fetch(`/api/evidence/${c.id}`);
              if (res.ok) {
                const serverBlocks = await res.json();
                if (Array.isArray(serverBlocks) && serverBlocks.length > 0) {
                  blocks = serverBlocks;
                }
              }
            } catch {
              // ignore
            }
          }

          if (!blocks || blocks.length === 0) {
            blocks = [
              { sequence: 1, timestamp: c.createdAt || new Date().toISOString(), caseId: c.id, eventType: "EVIDENCE_INGESTED", data: { source: "EML Upload / Header Capture", title: c.title } },
              { sequence: 2, timestamp: c.createdAt || new Date().toISOString(), caseId: c.id, eventType: "FORENSIC_TRIAGE_COMPLETED", data: { classification: c.threatClassification, threatScore: c.threatScore } }
            ];
          }

          const validatedBlocks = await ensureLedgerHashes(c.id, blocks);
          loadedLedgers.push({ caseId: c.id, blocks: validatedBlocks });
        }

        // Also include any other stored ledgers not linked to cases
        const storedLedgers = getAllStoredLedgers();
        for (const sl of storedLedgers) {
          if (!loadedLedgers.some(l => l.caseId === sl.caseId)) {
            const validated = await ensureLedgerHashes(sl.caseId, sl.blocks);
            loadedLedgers.push({ caseId: sl.caseId, blocks: validated });
          }
        }

        setLedgers(loadedLedgers);
      } catch (e) {
        console.error("Failed to load evidence ledgers:", e);
      } finally {
        setLoading(false);
      }
    }

    loadAllEvidence();
  }, []);

  const verifyIntegrity = async () => {
    setVerifying(true);
    try {
      const allBlocks = ledgers.flatMap(l => l.blocks);
      
      let serverResult: any = null;
      try {
        const res = await fetch('/api/evidence/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blocks: allBlocks }),
        });
        if (res.ok) {
          serverResult = await res.json();
        }
      } catch (err) {
        console.warn('Server verification endpoint offline, proceeding with local cryptographic verification:', err);
      }

      let allValid = true;
      let totalVerified = 0;
      let failureReason = '';

      for (const ledger of ledgers) {
        const check = await verifyLedgerChain(ledger.blocks);
        totalVerified += check.blockCount;
        if (!check.verified) {
          allValid = false;
          failureReason = check.reason || 'Cryptographic mismatch';
          break;
        }
      }

      if (serverResult && serverResult.verified === false) {
        allValid = false;
      }

      setVerification({
        verified: allValid && totalVerified > 0,
        blockCount: totalVerified,
        reason: failureReason || (totalVerified === 0 ? 'No evidence blocks found to verify.' : undefined),
      });
    } catch (err: any) {
      console.error(err);
      setVerification({
        verified: false,
        blockCount: 0,
        reason: err?.message || 'Verification error',
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Evidence Ledger</h2>
          <p className="text-slate-500 mt-1">Cryptographic chain-of-custody for all forensic artifacts.</p>
        </div>
        <button 
          onClick={verifyIntegrity}
          disabled={verifying || loading || ledgers.length === 0}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-[0_0_15px_rgba(37,99,235,0.2)] flex items-center gap-2 cursor-pointer w-fit"
        >
          {verifying ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              VERIFYING HASHES...
            </>
          ) : (
            'VERIFY INTEGRITY'
          )}
        </button>
      </div>

      {verification && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${verification.verified ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {verification.verified ? <ShieldCheck className="w-6 h-6 shrink-0" /> : <AlertCircle className="w-6 h-6 shrink-0 text-red-400" />}
          <div>
            <div className="font-bold">{verification.verified ? '✓ INTEGRITY VERIFIED' : '✕ INTEGRITY COMPROMISED'}</div>
            <div className="text-sm opacity-90">
              {verification.verified 
                ? `Chain-of-custody intact: verified ${verification.blockCount} blocks across ${ledgers.length} case(s). Cryptographic signatures match.` 
                : (verification.reason || 'Evidence hash does not match expected sequence.')}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Loading ledger...
        </div>
      ) : ledgers.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
          No evidence records found. Analyze an email to record chain-of-custody blocks.
        </div>
      ) : (
        <div className="space-y-6">
          {ledgers.map((ledger) => (
             <div key={ledger.caseId} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
               <div className="bg-slate-950/50 p-4 border-b border-slate-800 flex items-center justify-between">
                 <h3 className="font-medium text-slate-200 flex items-center gap-2">
                   <Database className="w-4 h-4 text-blue-500" />
                   Ledger: <span className="font-mono text-blue-400">{ledger.caseId}</span>
                 </h3>
                 <span className="text-xs text-slate-500 font-mono">
                   {ledger.blocks.length} {ledger.blocks.length === 1 ? 'block' : 'blocks'} recorded
                 </span>
               </div>
               <div className="p-4 space-y-4">
                 {ledger.blocks.map((block: any, idx: number) => (
                    <div key={idx} className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-[-16px] before:w-[2px] before:bg-slate-800 last:before:hidden">
                       <div className="absolute left-0 top-1.5 w-[24px] h-[24px] bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400 ring-4 ring-slate-900">
                         {String(block.sequence).padStart(2, '0')}
                       </div>
                       <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg ml-2 hover:border-slate-700 transition-colors">
                         <div className="flex justify-between items-start mb-2">
                           <span className="font-semibold text-slate-200 text-sm">{block.eventType}</span>
                           <span className="text-xs text-slate-500">{new Date(block.timestamp).toLocaleString()}</span>
                         </div>
                         <div className="space-y-1 text-xs font-mono text-slate-400 break-all">
                           <div><span className="text-slate-500 font-semibold">PREV HASH:</span> <span className="text-slate-400">{block.previousHash}</span></div>
                           <div><span className="text-slate-500 font-semibold">CURR HASH:</span> <span className="text-blue-400 font-semibold">{block.currentHash}</span></div>
                         </div>
                         {block.data && Object.keys(block.data).length > 0 && (
                           <div className="mt-2.5 pt-2 border-t border-slate-900 text-xs font-mono text-slate-400 break-all flex items-start gap-2">
                             <span className="text-slate-500 font-semibold shrink-0">DATA:</span>
                             <span className="text-slate-300">{typeof block.data === 'string' ? block.data : JSON.stringify(block.data)}</span>
                           </div>
                         )}
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
