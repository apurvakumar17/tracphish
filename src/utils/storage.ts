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
