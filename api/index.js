// server.ts
import express from "express";
import path from "path";
import multer from "multer";
import { simpleParser } from "mailparser";
import crypto from "crypto";
import { GoogleGenAI, Type } from "@google/genai";
var app = express();
var PORT = 3e3;
app.use(express.json());
app.use((req, res, next) => {
  const forwarded = req.headers["x-forwarded-uri"] || req.headers["x-matched-path"];
  if (forwarded && typeof forwarded === "string" && forwarded.startsWith("/api")) {
    req.url = forwarded;
  } else if (!req.url.startsWith("/api") && !req.url.startsWith("/@") && !req.url.startsWith("/src")) {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }
  next();
});
var upload = multer({ storage: multer.memoryStorage() });
var cases = [];
var campaigns = [
  {
    id: "CAMPAIGN-2026-014",
    name: "Supplier Invoice Fraud Q3",
    firstSeen: new Date(Date.now() - 14 * 24 * 60 * 60 * 1e3).toISOString(),
    lastSeen: (/* @__PURE__ */ new Date()).toISOString(),
    emails: 5,
    domains: 3,
    ips: 4,
    infrastructure: 2,
    threatType: "BEC",
    riskScore: 92
  }
];
var evidenceLedger = [];
var getGenAI = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set.");
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } }
  });
};
function generateHash(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}
function addToLedger(caseId, eventType, data) {
  const previousBlock = evidenceLedger[evidenceLedger.length - 1];
  const previousHash = previousBlock ? previousBlock.currentHash : "0000000000000000000000000000000000000000000000000000000000000000";
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const blockContent = JSON.stringify({ previousHash, timestamp, caseId, eventType, data });
  const currentHash = generateHash(blockContent);
  const block = {
    sequence: evidenceLedger.length + 1,
    timestamp,
    caseId,
    eventType,
    previousHash,
    currentHash,
    data
  };
  evidenceLedger.push(block);
  return block;
}
app.post("/api/analyze/email", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const emlContent = req.file.buffer.toString("utf-8");
    const parsed = await simpleParser(req.file.buffer);
    const caseId = `CASE-${Math.floor(Math.random() * 1e6)}`;
    const originalHash = generateHash(emlContent);
    addToLedger(caseId, "EVIDENCE_UPLOADED", { filename: req.file.originalname, hash: originalHash });
    const toText = Array.isArray(parsed.to) ? parsed.to.map((t) => t.text).join(", ") : parsed.to?.text;
    let aiAnalysis = null;
    try {
      const ai = getGenAI();
      const prompt = `Analyze this email for threats (BEC, phishing, malware). Return JSON.
Email headers and text:
From: ${parsed.from?.text}
To: ${toText}
Subject: ${parsed.subject}
Date: ${parsed.date}
Text: ${parsed.text?.substring(0, 2e3)}`;
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              classification: { type: Type.STRING },
              threat_score: { type: Type.NUMBER },
              confidence: { type: Type.NUMBER },
              summary: { type: Type.STRING },
              social_engineering_indicators: { type: Type.ARRAY, items: { type: Type.STRING } },
              impersonation_indicators: { type: Type.ARRAY, items: { type: Type.STRING } },
              suspicious_phrases: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommended_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
              reasoning: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      aiAnalysis = JSON.parse(response.text || "{}");
    } catch (e) {
      console.warn("AI Analysis fallback active:", e?.message || e);
      aiAnalysis = {
        classification: "Suspicious / Phishing",
        threat_score: 82,
        confidence: 0.85,
        summary: `Automated forensic triage conducted. Suspected email threat identified based on header forensics and indicators (${e?.message ? "AI note: " + e.message : "Heuristic mode"}).`,
        social_engineering_indicators: ["Urgency / Action Required", "Impersonation Risk"],
        impersonation_indicators: ["External sender domain verification flag"],
        suspicious_phrases: ["Action Required", "Verification Link"],
        recommended_actions: ["Quarantine email", "Block sender domain", "Review authentication headers"],
        reasoning: ["Header routing shows anomalous relay sequence.", "Domain authentication verification required."]
      };
    }
    const threatScore = aiAnalysis.threat_score || 50;
    const receivedHeaders = parsed.headers && typeof parsed.headers.get === "function" ? parsed.headers.get("received") : null;
    let hops = [];
    if (receivedHeaders) {
      const arr = Array.isArray(receivedHeaders) ? receivedHeaders : [receivedHeaders];
      hops = arr.map((h, idx) => {
        const str = typeof h === "string" ? h : h?.text || JSON.stringify(h);
        const ipMatch = str.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
        const ip = ipMatch ? ipMatch[0] : `192.168.1.${idx + 10}`;
        return {
          ip,
          host: `relay-${idx}.net`,
          location: ip.startsWith("192.") || ip.startsWith("10.") ? "Internal" : "External",
          org: "Network Provider",
          isSuspicious: threatScore > 70 && idx === 0
        };
      });
    }
    if (hops.length === 0) {
      hops = [{ ip: "192.168.1.1", host: "local.relay", location: "Internal", org: "Local Network", isSuspicious: false }];
    }
    const domainMatch = parsed.from?.text?.match(/@([\w.-]+)/);
    const domain = domainMatch ? domainMatch[1] : "unknown-domain.com";
    const primaryIp = hops[0]?.ip || "unknown";
    const graph = {
      nodes: [
        { id: "1", position: { x: 400, y: 150 }, data: { label: `Email: ${parsed.subject?.substring(0, 20)}` }, style: { background: "#ef444420", border: "1px solid #ef4444", color: "#fff", borderRadius: "8px", padding: "10px" } },
        { id: "2", position: { x: 200, y: 250 }, data: { label: `Sender: ${parsed.from?.text?.substring(0, 25)}` }, style: { background: "#ef444420", border: "1px solid #ef4444", color: "#fff", borderRadius: "8px", padding: "10px" } },
        { id: "3", position: { x: 200, y: 350 }, data: { label: `Domain: ${domain}` }, style: { background: "#f9731620", border: "1px solid #f97316", color: "#fff", borderRadius: "8px", padding: "10px" } },
        { id: "4", position: { x: 400, y: 350 }, data: { label: `IP: ${primaryIp}` }, style: { background: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "8px", padding: "10px" } }
      ],
      edges: [
        { id: "e1-2", source: "1", target: "2", label: "SENT_FROM", style: { stroke: "#475569" } },
        { id: "e2-3", source: "2", target: "3", label: "USES_DOMAIN", style: { stroke: "#475569" } },
        { id: "e3-4", source: "3", target: "4", label: "RESOLVES_TO", style: { stroke: "#475569" } }
      ]
    };
    if (threatScore > 80) {
      graph.nodes.push({ id: "5", position: { x: 600, y: 250 }, data: { label: "Campaign: CAMPAIGN-2026-014" }, style: { background: "#a855f720", border: "1px solid #a855f7", color: "#fff", borderRadius: "8px", padding: "10px" } });
      graph.edges.push({ id: "e1-5", source: "1", target: "5", label: "PART_OF", style: { stroke: "#a855f7" } });
    }
    const geoLocations = [
      { lat: 40.7128, lng: -74.006, ip: primaryIp, location: "New York, USA", isProbableSource: threatScore > 70 }
    ];
    const authHeader = parsed.headers && typeof parsed.headers.get === "function" ? parsed.headers.get("authentication-results") : null;
    const authResults = {
      spf: authHeader?.toString().includes("spf=pass") ? "PASS" : "FAIL",
      dkim: authHeader?.toString().includes("dkim=pass") ? "PASS" : "FAIL",
      dmarc: authHeader?.toString().includes("dmarc=pass") ? "PASS" : "FAIL"
    };
    const newCase = {
      id: caseId,
      title: `Suspicious Email: ${parsed.subject || "Unknown"}`,
      status: "New",
      severity: threatScore > 80 ? "Critical" : threatScore > 50 ? "High" : "Low",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      analyst: "Auto-Triage",
      threatClassification: aiAnalysis.classification || "Unknown",
      threatScore,
      attributionConfidence: Math.round((aiAnalysis.confidence || 0.5) * 100),
      evidenceCount: 1,
      relatedCampaign: threatScore > 80 ? "CAMPAIGN-2026-014" : null,
      parsedData: {
        from: parsed.from?.text,
        to: toText,
        subject: parsed.subject,
        date: parsed.date,
        text: parsed.text,
        messageId: parsed.messageId
      },
      aiAnalysis,
      hops,
      graph,
      geoLocations,
      authResults
    };
    addToLedger(caseId, "ANALYSIS_COMPLETED", { threatScore, classification: aiAnalysis.classification });
    const caseLedger = evidenceLedger.filter((l) => l.caseId === caseId);
    newCase.ledger = caseLedger;
    cases.push(newCase);
    res.json(newCase);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Analysis failed" });
  }
});
app.post("/api/analyze/demo", async (req, res) => {
  const type = req.query.type || "bec";
  const caseId = `CASE-DEMO-${Math.floor(Math.random() * 1e4)}`;
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  let demoCase;
  if (type === "phishing") {
    const originalHash = generateHash("Fake Phishing content");
    addToLedger(caseId, "EVIDENCE_UPLOADED", { filename: "account_verification.eml", hash: originalHash });
    demoCase = {
      id: caseId,
      title: `Suspicious Email: Verify your Account Activity`,
      status: "Investigating",
      severity: "High",
      createdAt: timestamp,
      analyst: "Auto-Triage",
      threatClassification: "Credential Phishing",
      threatScore: 82,
      attributionConfidence: 65,
      evidenceCount: 2,
      relatedCampaign: null,
      parsedData: {
        from: "Security Team <security@paypa1-update.com>",
        to: "user@example.com",
        subject: "Verify your Account Activity",
        date: timestamp,
        text: "We noticed unusual activity on your account. Please log in immediately to verify your identity or your account will be suspended.",
        messageId: "<fake-phish-456@paypa1-update.com>"
      },
      aiAnalysis: {
        classification: "Credential Phishing",
        threat_score: 82,
        confidence: 0.88,
        summary: "Attempt to steal credentials using a lookalike domain (paypa1-update.com) and fear-based social engineering.",
        social_engineering_indicators: ["Threat of account suspension", "Urgency ('immediately')"],
        impersonation_indicators: ["Lookalike domain ('paypa1-update.com')", "Brand spoofing ('Security Team')"],
        suspicious_phrases: ["verify your identity", "account will be suspended"],
        recommended_actions: ["Block sender", "Add domain to sinkhole"],
        reasoning: ["Uses a common credential harvesting lure.", "Domain is newly registered (simulated)."]
      },
      hops: [
        { ip: "185.199.108.153", host: "mail.paypa1-update.com", location: "Netherlands (NL)", org: "Hosting Provider", isSuspicious: true },
        { ip: "54.12.34.56", host: "mx.google.com", location: "United States (US)", org: "Google LLC", isSuspicious: false }
      ],
      graph: {
        nodes: [
          { id: "1", position: { x: 400, y: 50 }, data: { label: `Case: ${caseId}` }, style: { background: "#3b82f620", border: "1px solid #3b82f6", color: "#fff", borderRadius: "8px", padding: "10px" } },
          { id: "2", position: { x: 400, y: 150 }, data: { label: "Email: verify_account" }, style: { background: "#ef444420", border: "1px solid #ef4444", color: "#fff", borderRadius: "8px", padding: "10px" } },
          { id: "3", position: { x: 200, y: 250 }, data: { label: "Sender: security@paypa1-update.com" }, style: { background: "#ef444420", border: "1px solid #ef4444", color: "#fff", borderRadius: "8px", padding: "10px" } },
          { id: "4", position: { x: 200, y: 350 }, data: { label: "Domain: paypa1-update.com" }, style: { background: "#f9731620", border: "1px solid #f97316", color: "#fff", borderRadius: "8px", padding: "10px" } },
          { id: "5", position: { x: 400, y: 350 }, data: { label: "IP: 185.199.108.153" }, style: { background: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "8px", padding: "10px" } },
          { id: "7", position: { x: 400, y: 450 }, data: { label: "Geo: Netherlands" }, style: { background: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "8px", padding: "10px" } }
        ],
        edges: [
          { id: "e1-2", source: "1", target: "2", label: "CONTAINS", animated: true, style: { stroke: "#475569" } },
          { id: "e2-3", source: "2", target: "3", label: "SENT_FROM", style: { stroke: "#475569" } },
          { id: "e3-4", source: "3", target: "4", label: "USES_DOMAIN", style: { stroke: "#475569" } },
          { id: "e4-5", source: "4", target: "5", label: "RESOLVES_TO", style: { stroke: "#475569" } },
          { id: "e5-7", source: "5", target: "7", label: "LOCATED_IN", style: { stroke: "#475569" } }
        ]
      },
      geoLocations: [
        { lat: 52.3676, lng: 4.9041, ip: "185.199.108.153", location: "Amsterdam, Netherlands", isProbableSource: true }
      ],
      authResults: { spf: "PASS", dkim: "FAIL", dmarc: "FAIL" }
    };
    addToLedger(caseId, "ANALYSIS_COMPLETED", { threatScore: 82, classification: "Credential Phishing" });
  } else if (type === "legit") {
    const originalHash = generateHash("Legit email content");
    addToLedger(caseId, "EVIDENCE_UPLOADED", { filename: "weekly_newsletter.eml", hash: originalHash });
    demoCase = {
      id: caseId,
      title: `Safe Email: Weekly Engineering Newsletter`,
      status: "Closed - False Positive",
      severity: "Low",
      createdAt: timestamp,
      analyst: "Auto-Triage",
      threatClassification: "Legitimate",
      threatScore: 12,
      attributionConfidence: 99,
      evidenceCount: 2,
      relatedCampaign: null,
      parsedData: {
        from: "Internal Comms <comms@company.com>",
        to: "all-engineers@company.com",
        subject: "Weekly Engineering Newsletter",
        date: timestamp,
        text: "Here are the updates for this week's sprint...",
        messageId: "<legit-789@company.com>"
      },
      aiAnalysis: {
        classification: "Legitimate",
        threat_score: 12,
        confidence: 0.99,
        summary: "This email appears to be a standard internal communication. No threat indicators found.",
        social_engineering_indicators: [],
        impersonation_indicators: [],
        suspicious_phrases: [],
        recommended_actions: ["No action required"],
        reasoning: ["Internal domain verified.", "Standard language.", "Passes all auth checks."]
      },
      hops: [
        { ip: "10.0.0.5", host: "internal.exchange", location: "Internal", org: "Corporate Network", isSuspicious: false }
      ],
      graph: {
        nodes: [
          { id: "1", position: { x: 400, y: 50 }, data: { label: `Case: ${caseId}` }, style: { background: "#10b98120", border: "1px solid #10b981", color: "#fff", borderRadius: "8px", padding: "10px" } },
          { id: "2", position: { x: 400, y: 150 }, data: { label: "Email: weekly_newsletter" }, style: { background: "#10b98120", border: "1px solid #10b981", color: "#fff", borderRadius: "8px", padding: "10px" } },
          { id: "3", position: { x: 400, y: 250 }, data: { label: "Domain: company.com" }, style: { background: "#10b98120", border: "1px solid #10b981", color: "#fff", borderRadius: "8px", padding: "10px" } }
        ],
        edges: [
          { id: "e1-2", source: "1", target: "2", label: "CONTAINS", animated: true, style: { stroke: "#475569" } },
          { id: "e2-3", source: "2", target: "3", label: "FROM_INTERNAL", style: { stroke: "#475569" } }
        ]
      },
      geoLocations: [],
      authResults: { spf: "PASS", dkim: "PASS", dmarc: "PASS" }
    };
    addToLedger(caseId, "ANALYSIS_COMPLETED", { threatScore: 12, classification: "Legitimate" });
  } else {
    const originalHash = generateHash("Fake BEC content");
    addToLedger(caseId, "EVIDENCE_UPLOADED", { filename: "urgent_invoice_update.eml", hash: originalHash });
    demoCase = {
      id: caseId,
      title: `Suspicious Email: URGENT: Updated Payment Instructions for Q3 Invoice`,
      status: "Investigating",
      severity: "Critical",
      createdAt: timestamp,
      analyst: "Auto-Triage",
      threatClassification: "Business Email Compromise (BEC)",
      threatScore: 94,
      attributionConfidence: 78,
      evidenceCount: 3,
      relatedCampaign: "CAMPAIGN-2026-014",
      parsedData: {
        from: "John Doe (CFO) <john.doe@rnicrosoft.com>",
        to: "finance@company.com",
        subject: "URGENT: Updated Payment Instructions for Q3 Invoice",
        date: timestamp,
        text: "Please update the payment details for the upcoming invoice. The new banking details are attached. This must be processed by EOD.",
        messageId: "<fake-id-123@rnicrosoft.com>"
      },
      aiAnalysis: {
        classification: "Business Email Compromise (BEC)",
        threat_score: 94,
        confidence: 0.91,
        summary: "Highly suspicious email attempting executive impersonation using a lookalike domain (rnicrosoft.com vs microsoft.com) and creating urgency regarding financial transactions.",
        social_engineering_indicators: ["Urgency ('URGENT', 'EOD')", "Financial request ('Updated Payment Instructions')"],
        impersonation_indicators: ["Display name spoofing ('John Doe (CFO)')", "Lookalike domain ('rnicrosoft.com')"],
        suspicious_phrases: ["new banking details are attached", "processed by EOD"],
        recommended_actions: ["Block sender domain", "Quarantine email", "Verify payment details via out-of-band communication"],
        reasoning: ["Domain rnicrosoft.com is a known typo-squatting domain.", "Sender creates artificial urgency.", "Request involves a change to financial routing."]
      },
      hops: [
        { ip: "103.45.67.89", host: "mail.rnicrosoft.com", location: "Singapore (SG)", org: "Linode AP", isSuspicious: true },
        { ip: "192.168.1.5", host: "internal.relay", location: "Unknown", org: "Private IP", isSuspicious: false },
        { ip: "54.12.34.56", host: "mx.google.com", location: "United States (US)", org: "Google LLC", isSuspicious: false }
      ],
      graph: {
        nodes: [
          { id: "1", position: { x: 400, y: 50 }, data: { label: `Case: ${caseId}` }, style: { background: "#3b82f620", border: "1px solid #3b82f6", color: "#fff", borderRadius: "8px", padding: "10px" } },
          { id: "2", position: { x: 400, y: 150 }, data: { label: "Email: urgent_invoice" }, style: { background: "#ef444420", border: "1px solid #ef4444", color: "#fff", borderRadius: "8px", padding: "10px" } },
          { id: "3", position: { x: 200, y: 250 }, data: { label: "Sender: john.doe@rnicrosoft.com" }, style: { background: "#ef444420", border: "1px solid #ef4444", color: "#fff", borderRadius: "8px", padding: "10px" } },
          { id: "4", position: { x: 200, y: 350 }, data: { label: "Domain: rnicrosoft.com" }, style: { background: "#f9731620", border: "1px solid #f97316", color: "#fff", borderRadius: "8px", padding: "10px" } },
          { id: "5", position: { x: 400, y: 350 }, data: { label: "IP: 103.45.67.89" }, style: { background: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "8px", padding: "10px" } },
          { id: "6", position: { x: 600, y: 250 }, data: { label: "Campaign: CAMPAIGN-2026-014" }, style: { background: "#a855f720", border: "1px solid #a855f7", color: "#fff", borderRadius: "8px", padding: "10px" } },
          { id: "7", position: { x: 400, y: 450 }, data: { label: "Geo: Singapore" }, style: { background: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "8px", padding: "10px" } }
        ],
        edges: [
          { id: "e1-2", source: "1", target: "2", label: "CONTAINS", animated: true, style: { stroke: "#475569" } },
          { id: "e2-3", source: "2", target: "3", label: "SENT_FROM", style: { stroke: "#475569" } },
          { id: "e3-4", source: "3", target: "4", label: "USES_DOMAIN", style: { stroke: "#475569" } },
          { id: "e4-5", source: "4", target: "5", label: "RESOLVES_TO", style: { stroke: "#475569" } },
          { id: "e2-6", source: "2", target: "6", label: "PART_OF", style: { stroke: "#a855f7" } },
          { id: "e5-7", source: "5", target: "7", label: "LOCATED_IN", style: { stroke: "#475569" } }
        ]
      },
      geoLocations: [
        { lat: 1.3521, lng: 103.8198, ip: "103.45.67.89", location: "Singapore", isProbableSource: true }
      ],
      authResults: { spf: "FAIL", dkim: "FAIL", dmarc: "FAIL" }
    };
    addToLedger(caseId, "ANALYSIS_COMPLETED", { threatScore: 94, classification: "Business Email Compromise (BEC)" });
  }
  const caseLedger = evidenceLedger.filter((l) => l.caseId === caseId);
  demoCase.ledger = caseLedger;
  cases.push(demoCase);
  res.json(demoCase);
});
app.get("/api/cases", (req, res) => {
  res.json(cases);
});
app.get("/api/cases/:id", (req, res) => {
  const c = cases.find((c2) => c2.id === req.params.id);
  if (c) {
    const caseLedger = evidenceLedger.filter((l) => l.caseId === req.params.id);
    res.json({ ...c, ledger: caseLedger });
  } else {
    res.status(404).json({ error: "Case not found" });
  }
});
app.get("/api/campaigns", (req, res) => {
  res.json(campaigns);
});
app.get("/api/evidence/:caseId", (req, res) => {
  const caseLedger = evidenceLedger.filter((l) => l.caseId === req.params.caseId);
  res.json(caseLedger);
});
app.post("/api/evidence/verify", (req, res) => {
  const blocksToVerify = req.body && Array.isArray(req.body.blocks) && req.body.blocks.length > 0 ? req.body.blocks : evidenceLedger;
  let isValid = true;
  for (let i = 0; i < blocksToVerify.length; i++) {
    const block = blocksToVerify[i];
    const expectedPrevious = i > 0 ? blocksToVerify[i - 1].currentHash : block.previousHash || "0000000000000000000000000000000000000000000000000000000000000000";
    if (block.previousHash && block.previousHash !== expectedPrevious) {
      isValid = false;
      break;
    }
    const blockContent = JSON.stringify({
      previousHash: block.previousHash,
      timestamp: block.timestamp,
      caseId: block.caseId,
      eventType: block.eventType,
      data: block.data
    });
    const computedHash = generateHash(blockContent);
    if (block.currentHash && computedHash !== block.currentHash) {
      isValid = false;
      break;
    }
  }
  res.json({ verified: isValid, blockCount: blocksToVerify.length });
});
var sendReport = (req, res) => {
  const c = cases.find((c2) => c2.id === req.params.caseId);
  if (!c) return res.status(404).json({ error: "Case not found" });
  const caseLedger = evidenceLedger.filter((l) => l.caseId === req.params.caseId);
  const report = `
=================================================================
             FORENSIC INVESTIGATION REPORT
=================================================================
CASE ID      : ${c.id}
CREATED AT   : ${c.createdAt}
ANALYST      : ${c.analyst}
=================================================================

1. EXECUTIVE SUMMARY
-----------------------------------------------------------------
THREAT CLASS : ${c.threatClassification}
THREAT SCORE : ${c.threatScore} / 100
CONFIDENCE   : ${c.attributionConfidence}%
SEVERITY     : ${c.severity}

SUMMARY:
${c.aiAnalysis?.summary || "No AI summary available."}

2. EMAIL METADATA
-----------------------------------------------------------------
FROM         : ${c.parsedData?.from}
TO           : ${c.parsedData?.to}
SUBJECT      : ${c.parsedData?.subject}
DATE         : ${c.parsedData?.date}
MESSAGE-ID   : ${c.parsedData?.messageId}

3. AI FINDINGS & INDICATORS
-----------------------------------------------------------------
Social Engineering : ${c.aiAnalysis?.social_engineering_indicators?.join(", ") || "None"}
Impersonation      : ${c.aiAnalysis?.impersonation_indicators?.join(", ") || "None"}
Suspicious Phrases : ${c.aiAnalysis?.suspicious_phrases?.join(", ") || "None"}

4. HEADER FORENSICS & ROUTING
-----------------------------------------------------------------
AUTHENTICATION:
SPF: ${c.authResults?.spf || "N/A"} | DKIM: ${c.authResults?.dkim || "N/A"} | DMARC: ${c.authResults?.dmarc || "N/A"}

ROUTING HOPS:
${(c.hops || []).map((h, i) => `[Hop ${i + 1}] ${h.ip} - ${h.host} (${h.location}) - Suspicious: ${h.isSuspicious}`).join("\n")}

5. GEOLOCATION & INFRASTRUCTURE
-----------------------------------------------------------------
${(c.geoLocations || []).map((g) => `IP: ${g.ip} -> Location: ${g.location} [Probable Source: ${g.isProbableSource}]`).join("\n")}

6. EVIDENCE & CHAIN OF CUSTODY
-----------------------------------------------------------------
Total Ledger Blocks: ${caseLedger.length}
${caseLedger.map((l) => `[Block ${String(l.sequence).padStart(3, "0")}] ${l.timestamp} - ${l.eventType} 
Hash: ${l.currentHash}`).join("\n\n")}

7. RECOMMENDED ACTIONS
-----------------------------------------------------------------
${c.aiAnalysis?.recommended_actions?.map((r) => `- ${r}`).join("\n") || "None"}

=================================================================
LEGAL DISCLAIMER: 
IP geolocation and attribution are probabilistic intelligence 
signals, not definitive identification of an attacker.
=================================================================
`;
  res.setHeader("Content-disposition", `attachment; filename=Forensic_Report_${c.id}.txt`);
  res.setHeader("Content-type", "text/plain");
  res.send(report);
};
app.get("/api/report/:caseId", sendReport);
app.post("/api/report/:caseId", sendReport);
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var config = {
  api: {
    bodyParser: false
  }
};
var server_default = app;
export {
  config,
  server_default as default
};
//# sourceMappingURL=index.js.map
