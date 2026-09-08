import { Case } from '../types';

const CASES_STORAGE_KEY = 'tracphish_cases';
const LEDGER_STORAGE_KEY = 'tracphish_ledger';

export function getStoredCases(): Case[] {
  try {
    const raw = localStorage.getItem(CASES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read cases from localStorage:', e);
    return [];
  }
}

export function saveStoredCase(newCase: Case) {
  try {
    const existing = getStoredCases();
    const index = existing.findIndex(c => c.id === newCase.id);
    if (index >= 0) {
      existing[index] = newCase;
    } else {
      existing.push(newCase);
    }
    localStorage.setItem(CASES_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to save case to localStorage:', e);
  }
}

export function mergeServerCases(serverCases: Case[]): Case[] {
  try {
    const local = getStoredCases();
    const map = new Map<string, Case>();
    local.forEach(c => map.set(c.id, c));
    if (Array.isArray(serverCases)) {
      serverCases.forEach(c => map.set(c.id, c));
    }
    const merged = Array.from(map.values());
    localStorage.setItem(CASES_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.error('Failed to merge cases:', e);
    return Array.isArray(serverCases) && serverCases.length > 0 ? serverCases : getStoredCases();
  }
}

export function getStoredCaseById(id: string): Case | null {
  const cases = getStoredCases();
  return cases.find(c => c.id === id) || null;
}

export function saveStoredLedger(caseId: string, blocks: any[]) {
  try {
    const raw = localStorage.getItem(LEDGER_STORAGE_KEY);
    const ledgerMap = raw ? JSON.parse(raw) : {};
    ledgerMap[caseId] = blocks;
    localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(ledgerMap));
  } catch (e) {
    console.error('Failed to save ledger to localStorage:', e);
  }
}

export function getStoredLedger(caseId: string): any[] {
  try {
    const raw = localStorage.getItem(LEDGER_STORAGE_KEY);
    const ledgerMap = raw ? JSON.parse(raw) : {};
    return ledgerMap[caseId] || [];
  } catch (e) {
    console.error('Failed to read ledger from localStorage:', e);
    return [];
  }
}

export function getAllStoredLedgers(): { caseId: string; blocks: any[] }[] {
  try {
    const raw = localStorage.getItem(LEDGER_STORAGE_KEY);
    const ledgerMap = raw ? JSON.parse(raw) : {};
    return Object.entries(ledgerMap).map(([caseId, blocks]) => ({
      caseId,
      blocks: Array.isArray(blocks) ? blocks : [],
    }));
  } catch (e) {
    return [];
  }
}

export function downloadForensicReport(caseData: Case, customLedger?: any[]) {
  const caseLedger = customLedger || getStoredLedger(caseData.id);
  const report = `=================================================================
             FORENSIC INVESTIGATION REPORT
=================================================================
CASE ID      : ${caseData.id}
CREATED AT   : ${caseData.createdAt}
ANALYST      : ${caseData.analyst || "Auto-Triage"}
=================================================================

1. EXECUTIVE SUMMARY
-----------------------------------------------------------------
THREAT CLASS : ${caseData.threatClassification}
THREAT SCORE : ${caseData.threatScore} / 100
CONFIDENCE   : ${caseData.attributionConfidence}%
SEVERITY     : ${caseData.severity}

SUMMARY:
${caseData.aiAnalysis?.summary || "No AI summary available."}

2. EMAIL METADATA
-----------------------------------------------------------------
FROM         : ${caseData.parsedData?.from || "N/A"}
TO           : ${caseData.parsedData?.to || "N/A"}
SUBJECT      : ${caseData.parsedData?.subject || "N/A"}
DATE         : ${caseData.parsedData?.date || "N/A"}
MESSAGE-ID   : ${caseData.parsedData?.messageId || "N/A"}

3. AI FINDINGS & INDICATORS
-----------------------------------------------------------------
Social Engineering : ${caseData.aiAnalysis?.social_engineering_indicators?.join(', ') || "None"}
Impersonation      : ${caseData.aiAnalysis?.impersonation_indicators?.join(', ') || "None"}
Suspicious Phrases : ${caseData.aiAnalysis?.suspicious_phrases?.join(', ') || "None"}

4. HEADER FORENSICS & ROUTING
-----------------------------------------------------------------
AUTHENTICATION:
SPF: ${caseData.authResults?.spf || "N/A"} | DKIM: ${caseData.authResults?.dkim || "N/A"} | DMARC: ${caseData.authResults?.dmarc || "N/A"}

ROUTING HOPS:
${(caseData.hops || []).map((h: any, i: number) => `[Hop ${i+1}] ${h.ip} - ${h.host} (${h.location}) - Suspicious: ${h.isSuspicious}`).join('\n') || "None recorded"}

5. GEOLOCATION & INFRASTRUCTURE
-----------------------------------------------------------------
${(caseData.geoLocations || []).map((g: any) => `IP: ${g.ip} -> Location: ${g.location} [Probable Source: ${g.isProbableSource}]`).join('\n') || "None recorded"}

6. EVIDENCE & CHAIN OF CUSTODY
-----------------------------------------------------------------
Total Ledger Blocks: ${caseLedger.length}
${caseLedger.map((l: any) => `[Block ${String(l.sequence).padStart(3, '0')}] ${l.timestamp} - ${l.eventType} \nHash: ${l.currentHash}`).join('\n\n') || "None recorded"}

7. RECOMMENDED ACTIONS
-----------------------------------------------------------------
${caseData.aiAnalysis?.recommended_actions?.map((r: string) => `- ${r}`).join('\n') || "None"}

=================================================================
LEGAL DISCLAIMER: 
IP geolocation and attribution are probabilistic intelligence 
signals, not definitive identification of an attacker.
=================================================================
`;

  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Forensic_Report_${caseData.id}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

