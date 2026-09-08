import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Case, LedgerEntry } from '../types';
import { getStoredCaseById, saveStoredCase, getStoredLedger, saveStoredLedger, downloadForensicReport } from '../utils/storage';
import { ShieldAlert, ArrowLeft, BrainCircuit, Network, Globe, MapPin, Database, CheckCircle, XCircle, Download, AlertTriangle } from 'lucide-react';
import { ReactFlow, Background, Controls, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '../App';
import L from 'leaflet';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [verification, setVerification] = useState<{verified: boolean, blockCount: number} | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'forensics' | 'graph' | 'custody'>('overview');

  useEffect(() => {
    // Pre-populate immediately from localStorage
    const localCase = id ? getStoredCaseById(id) : null;
    if (localCase) setCaseData(localCase);

    const localLedger = id ? getStoredLedger(id) : [];
    if (localLedger.length > 0) setLedger(localLedger);

    // Fetch and sync from server
    fetch(`/api/cases/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Case not found on server');
        return r.json();
      })
      .then(data => {
        if (data && data.id) {
          setCaseData(data);
          saveStoredCase(data);
        }
      })
      .catch(err => {
        console.warn("Case sync failed, using localStorage fallback:", err);
      });

    fetch(`/api/evidence/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Evidence not found on server');
        return r.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setLedger(data);
          if (id) saveStoredLedger(id, data);
        }
      })
      .catch(err => {
        console.warn("Evidence sync failed, using localStorage fallback:", err);
      });
  }, [id]);

  const verifyEvidence = async () => {
    try {
      const res = await fetch('/api/evidence/verify', { method: 'POST' });
      const data = await res.json();
      setVerification(data);
    } catch (e) {
      console.error(e);
    }
  };

  if (!caseData) return <div className="p-8 text-slate-500">Loading Case Data...</div>;

  const tabs = [
    { id: 'overview', name: 'Overview & AI Findings', icon: BrainCircuit },
    { id: 'forensics', name: 'Header Forensics', icon: Network },
    { id: 'graph', name: 'Investigation Graph', icon: Globe },
    { id: 'custody', name: 'Chain of Custody', icon: Database },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <Link to="/cases" className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">{caseData.title}</h2>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
              caseData.severity === 'Critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
              caseData.severity === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
              'bg-blue-500/10 text-blue-400 border-blue-500/20'
            }`}>
              {caseData.severity}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 font-medium">
            <span className="font-mono text-blue-400/80">{caseData.id}</span>
            <span>•</span>
            <span>Created {new Date(caseData.createdAt).toLocaleString()}</span>
            <span>•</span>
            <span>Status: {caseData.status}</span>
          </div>
        </div>
        <div className="ml-auto flex gap-3">
          <button
            onClick={() => downloadForensicReport(caseData, ledger)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-800 shrink-0 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                isActive 
                  ? "border-blue-500 text-blue-400 bg-blue-500/5" 
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.name}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto pb-12">
        {activeTab === 'overview' && <OverviewTab data={caseData} />}
        {activeTab === 'forensics' && <ForensicsTab data={caseData} />}
        {activeTab === 'graph' && <GraphTab data={caseData} />}
        {activeTab === 'custody' && (
          <CustodyTab 
            ledger={ledger} 
            verification={verification} 
            verifyEvidence={verifyEvidence} 
          />
        )}
      </div>
    </div>
  );
}

function OverviewTab({ data }: { data: Case }) {
  const isDemo = data.id.includes("DEMO");
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:col-span-1 flex flex-col justify-center items-center text-center">
           <div className="relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="56" className="stroke-slate-800" strokeWidth="12" fill="none" />
                <circle 
                  cx="64" cy="64" r="56" 
                  className={data.threatScore > 80 ? "stroke-red-500" : data.threatScore > 50 ? "stroke-orange-500" : "stroke-blue-500"} 
                  strokeWidth="12" fill="none" 
                  strokeDasharray="351.85" 
                  strokeDashoffset={351.85 - (351.85 * data.threatScore) / 100} 
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-100">{data.threatScore}</span>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Score</span>
              </div>
           </div>
           <h3 className="text-xl font-bold text-slate-200 mt-6">{data.threatClassification}</h3>
           <p className="text-sm text-slate-400 mt-2 max-w-xs">{data.aiAnalysis?.summary || "No summary available."}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:col-span-2 space-y-6">
           <div>
             <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
               <ShieldAlert className="w-5 h-5 text-blue-500" />
               AI Threat Findings
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.aiAnalysis?.social_engineering_indicators?.length > 0 && (
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-orange-400 mb-2">Social Engineering</h4>
                    <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                      {data.aiAnalysis.social_engineering_indicators.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
                    </ul>
                  </div>
                )}
                {data.aiAnalysis?.impersonation_indicators?.length > 0 && (
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-purple-400 mb-2">Impersonation</h4>
                    <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                      {data.aiAnalysis.impersonation_indicators.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
                    </ul>
                  </div>
                )}
             </div>
           </div>
           
           {data.aiAnalysis?.reasoning?.length > 0 && (
             <div>
               <h4 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Analysis Reasoning</h4>
               <ul className="space-y-2">
                 {data.aiAnalysis.reasoning.map((r: string, idx: number) => (
                   <li key={idx} className="flex gap-3 text-sm text-slate-300">
                     <span className="text-blue-500 mt-0.5">•</span>
                     <span>{r}</span>
                   </li>
                 ))}
               </ul>
             </div>
           )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Original Email Metadata</h3>
          <span className="text-xs font-mono text-slate-500">ID: {data.parsedData?.messageId}</span>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-4">
             <div>
               <span className="text-slate-500 block mb-1">From</span>
               <div className="font-mono bg-slate-950 border border-slate-800 p-2 rounded text-slate-300 break-all">{data.parsedData?.from}</div>
             </div>
             <div>
               <span className="text-slate-500 block mb-1">To</span>
               <div className="font-mono bg-slate-950 border border-slate-800 p-2 rounded text-slate-300 break-all">{data.parsedData?.to}</div>
             </div>
          </div>
          <div className="space-y-4">
             <div>
               <span className="text-slate-500 block mb-1">Subject</span>
               <div className="bg-slate-950 border border-slate-800 p-2 rounded text-slate-300 font-medium">{data.parsedData?.subject}</div>
             </div>
             <div>
               <span className="text-slate-500 block mb-1">Date</span>
               <div className="bg-slate-950 border border-slate-800 p-2 rounded text-slate-300">{new Date(data.parsedData?.date).toLocaleString()}</div>
             </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-800">
          <span className="text-slate-500 block mb-2 text-sm">Body Snippet</span>
          <pre className="font-mono text-xs bg-slate-950 border border-slate-800 p-4 rounded-lg text-slate-400 whitespace-pre-wrap max-h-64 overflow-y-auto">
            {data.parsedData?.text || "No text available."}
          </pre>
        </div>
      </div>
    </div>
  );
}

function ForensicsTab({ data }: { data: Case }) {
  const hops = data.hops || [];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-6">Mail Routing Timeline</h3>
        <div className="relative border-l border-slate-800 ml-4 space-y-8 pb-4">
          {hops.map((hop, idx) => (
            <div key={idx} className="relative pl-8">
              <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${hop.isSuspicious ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-blue-500'}`} />
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 max-w-2xl">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-mono text-sm text-slate-200">{hop.ip}</div>
                  <div className="text-xs text-slate-500 font-medium">Hop {idx + 1}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-slate-500">Host:</span> <span className="text-slate-300">{hop.host}</span></div>
                  <div><span className="text-slate-500">Geo:</span> <span className="text-slate-300">{hop.location}</span></div>
                  <div className="col-span-2"><span className="text-slate-500">Org:</span> <span className="text-slate-300">{hop.org}</span></div>
                </div>
                {hop.isSuspicious && (
                  <div className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Suspicious routing infrastructure identified. High risk of spoofing.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Authentication Results</h3>
        <div className="grid grid-cols-3 gap-4">
           {['SPF', 'DKIM', 'DMARC'].map((auth) => (
             <div key={auth} className="bg-slate-950 border border-slate-800 p-4 rounded-lg flex flex-col items-center text-center">
               <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-2">{auth}</span>
               {data.authResults && data.authResults[auth.toLowerCase() as keyof typeof data.authResults] === "FAIL" ? (
                 <span className="text-red-400 font-medium flex items-center gap-1"><XCircle className="w-4 h-4"/> FAIL</span>
               ) : data.authResults && data.authResults[auth.toLowerCase() as keyof typeof data.authResults] === "PASS" ? (
                 <span className="text-green-400 font-medium flex items-center gap-1"><CheckCircle className="w-4 h-4"/> PASS</span>
               ) : (
                 <span className="text-slate-400 font-medium">Not Available</span>
               )}
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}

function GraphTab({ data }: { data: Case }) {
  const initialNodes = data.graph?.nodes || [];
  const initialEdges = data.graph?.edges || [];
  const geoLocations = data.geoLocations || [];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-[500px]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-200">Investigation Graph</h3>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">Interactive</span>
        </div>
        <div className="h-[430px] w-full rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
          <ReactFlow nodes={initialNodes} edges={initialEdges} fitView colorMode="dark">
            <Background color="#1e293b" gap={20} />
            <Controls />
          </ReactFlow>
        </div>
      </div>

      {geoLocations.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-[450px] flex flex-col">
           <div className="flex justify-between items-center mb-4 shrink-0">
             <div>
               <h3 className="text-lg font-semibold text-slate-200">GeoLocation & Infrastructure</h3>
               <p className="text-xs text-slate-400 max-w-2xl mt-1">IP geolocation and attribution are probabilistic intelligence signals. VPNs, proxies, and cloud infrastructure may obscure the true origin.</p>
             </div>
             <div className="text-right">
               <div className="text-sm text-slate-400">Attribution Confidence</div>
               <div className="text-xl font-bold text-blue-400">{data.attributionConfidence}%</div>
             </div>
           </div>
           <div className="flex-1 rounded-lg border border-slate-800 overflow-hidden z-0 relative">
             <MapContainer center={[geoLocations[0].lat, geoLocations[0].lng]} zoom={2} className="dark-tiles" style={{ height: '100%', width: '100%', background: '#020617' }}>
               <TileLayer
                 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                 attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
               />
               {geoLocations.map((geo, idx) => (
                 <Marker key={idx} position={[geo.lat, geo.lng]}>
                   <Popup className="bg-slate-900 border-slate-800 text-slate-200">
                     <strong>{geo.isProbableSource ? "Probable Source Infrastructure" : "Observed Infrastructure"}</strong><br/>
                     IP: {geo.ip}<br/>
                     Location: {geo.location}
                   </Popup>
                 </Marker>
               ))}
             </MapContainer>
           </div>
        </div>
      )}
    </div>
  );
}

function CustodyTab({ ledger, verification, verifyEvidence }: { ledger: LedgerEntry[], verification: any, verifyEvidence: () => void }) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-200">Chain of Custody Ledger</h3>
            <p className="text-sm text-slate-400 mt-1">Tamper-evident, cryptographically hashed event log.</p>
          </div>
          <button 
            onClick={verifyEvidence}
            className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            Verify Evidence Integrity
          </button>
        </div>

        {verification && (
          <div className={cn("p-4 rounded-lg mb-6 flex items-center gap-3 border", verification.verified ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400")}>
            {verification.verified ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <div>
              <div className="font-semibold">{verification.verified ? "Evidence Integrity Verified" : "Evidence Integrity Compromised"}</div>
              <div className="text-xs opacity-80">Cryptographic hash chain validated across {verification.blockCount} blocks.</div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {ledger.map((entry) => (
            <div key={entry.sequence} className="bg-slate-950 border border-slate-800 rounded-lg p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded">BLOCK {String(entry.sequence).padStart(3, '0')}</span>
                <span className="text-xs text-slate-500">{new Date(entry.timestamp).toLocaleString()}</span>
              </div>
              <div className="text-sm font-semibold text-slate-200 mb-4">{entry.eventType.replace(/_/g, ' ')}</div>
              
              <div className="space-y-2 font-mono text-[10px] sm:text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-slate-500">
                  <span className="w-24 shrink-0 uppercase tracking-wider">Prev Hash:</span>
                  <span className="truncate text-slate-600">{entry.previousHash}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-slate-300">
                  <span className="w-24 shrink-0 uppercase tracking-wider">Curr Hash:</span>
                  <span className="truncate text-blue-400">{entry.currentHash}</span>
                </div>
              </div>
            </div>
          ))}
          {ledger.length === 0 && (
            <div className="text-center text-slate-500 py-8">No ledger entries found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
