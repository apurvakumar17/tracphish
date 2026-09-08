import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../App';
import { saveStoredCase, saveStoredLedger } from '../utils/storage';

export default function AnalyzeEmail() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    
    const stages = [
      "Evidence captured...",
      "Parsing email...",
      "Extracting headers...",
      "Analyzing authentication...",
      "Extracting URLs...",
      "Inspecting domains...",
      "Analyzing mail routing...",
      "Running AI threat assessment...",
      "Correlating infrastructure...",
      "Calculating risk...",
      "Preserving evidence..."
    ];

    for (let i = 0; i < stages.length; i++) {
      setStage(stages[i]);
      setProgress(((i + 1) / stages.length) * 100);
      await new Promise(r => setTimeout(r, 600)); // fake delay for UI
    }
    
    setProgress(100);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch('/api/analyze/email', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const errorText = errJson?.error || `Server responded with status ${res.status}`;
        throw new Error(errorText);
      }
      const data = await res.json();
      if (data.id) {
        saveStoredCase(data);
        saveStoredLedger(data.id, [
          { sequence: 1, timestamp: new Date().toISOString(), caseId: data.id, eventType: "EVIDENCE_UPLOADED", data: { filename: file.name } },
          { sequence: 2, timestamp: new Date().toISOString(), caseId: data.id, eventType: "ANALYSIS_COMPLETED", data: { threatScore: data.threatScore, classification: data.threatClassification } }
        ]);
        navigate(`/cases/${data.id}`);
      } else {
        throw new Error("No case ID returned from analysis.");
      }
    } catch (err: any) {
      console.error("Email analysis failed:", err);
      alert(`Analysis failed: ${err?.message || "Please check server logs or environment variables."}`);
      setIsAnalyzing(false);
    }
  };

  const loadDemo = async (scenario: string = 'bec') => {
    setIsAnalyzing(true);
    
    const stages = [
      `Loading Demo ${scenario.toUpperCase()} Scenario...`,
      "Extracting headers...",
      "Analyzing mail routing...",
      "Correlating infrastructure...",
      "Calculating risk...",
      "Preserving evidence..."
    ];

    for (let i = 0; i < stages.length; i++) {
      setStage(stages[i]);
      setProgress(((i + 1) / stages.length) * 100);
      await new Promise(r => setTimeout(r, 400));
    }
    
    try {
      const res = await fetch(`/api/analyze/demo?type=${scenario}`, { method: 'POST' });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Server responded with status ${res.status}`);
      }
      const data = await res.json();
      if (data.id) {
        saveStoredCase(data);
        saveStoredLedger(data.id, [
          { sequence: 1, timestamp: new Date().toISOString(), caseId: data.id, eventType: "DEMO_SCENARIO_LOADED", data: { scenario } },
          { sequence: 2, timestamp: new Date().toISOString(), caseId: data.id, eventType: "ANALYSIS_COMPLETED", data: { threatScore: data.threatScore, classification: data.threatClassification } }
        ]);
        navigate(`/cases/${data.id}`);
      } else {
        throw new Error("No demo case ID returned.");
      }
    } catch (err: any) {
      console.error("Demo analysis failed:", err);
      alert(`Demo loading failed: ${err?.message || "Could not load demo scenario."}`);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Analyze Email Evidence</h2>
        <p className="text-slate-500 mt-1">Upload a raw .eml file to trace routing, extract indicators, and perform AI threat assessment.</p>
      </div>

      <div 
        className={cn(
          "border-2 border-dashed rounded-2xl p-12 transition-colors flex flex-col items-center justify-center text-center",
          file ? "border-blue-500/50 bg-blue-500/5" : "border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700"
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          accept=".eml" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
        />
        
        {file ? (
          <div className="space-y-4 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
              <File className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-200">{file.name}</p>
              <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
            
            {!isAnalyzing ? (
              <div className="flex gap-4 mt-6">
                <button 
                  onClick={() => setFile(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAnalyze}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                >
                  Start Forensic Analysis
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-full max-w-md mt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-400 font-medium flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {stage}
                  </span>
                  <span className="text-slate-500">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 flex flex-col items-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-2">
              <UploadCloud className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-200">Drag & drop your .eml file here</p>
            <p className="text-sm text-slate-500">or click to browse from your computer</p>
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 mt-1">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-200">Demo Mode</h3>
            <p className="text-sm text-slate-400 mt-1 mb-4 leading-relaxed">
              Load realistic pre-configured scenarios to see the platform's correlation and forensics engine in action without needing to upload a raw file.
            </p>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => loadDemo('bec')}
                disabled={isAnalyzing}
                className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex-1 min-w-[200px]"
              >
                Demo 1: BEC (Urgent Payment)
              </button>
              <button 
                onClick={() => loadDemo('phishing')}
                disabled={isAnalyzing}
                className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex-1 min-w-[200px]"
              >
                Demo 2: Credential Phishing
              </button>
              <button 
                onClick={() => loadDemo('legit')}
                disabled={isAnalyzing}
                className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex-1 min-w-[200px]"
              >
                Demo 3: Legitimate Safe Email
              </button>
            </div>
            
            {isAnalyzing && !file && (
              <div className="w-full mt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-400 font-medium flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {stage}
                  </span>
                  <span className="text-slate-500">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
