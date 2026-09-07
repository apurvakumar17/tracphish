export interface Hop {
  ip: string;
  host: string;
  location: string;
  org: string;
  isSuspicious: boolean;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  ip: string;
  location: string;
  isProbableSource?: boolean;
}

export interface Case {
  id: string;
  title: string;
  status: string;
  severity: string;
  createdAt: string;
  analyst: string;
  threatClassification: string;
  threatScore: number;
  attributionConfidence: number;
  evidenceCount: number;
  relatedCampaign: string | null;
  parsedData?: any;
  aiAnalysis?: any;
  hops?: Hop[];
  graph?: {
    nodes: any[];
    edges: any[];
  };
  geoLocations?: GeoLocation[];
  authResults?: { spf: string; dkim: string; dmarc: string };
}

export interface LedgerEntry {
  sequence: number;
  timestamp: string;
  caseId: string;
  eventType: string;
  previousHash: string;
  currentHash: string;
  data: any;
}
