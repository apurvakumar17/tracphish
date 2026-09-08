# 🛡️ TracPhish

<div align="center">

[![React 19](https://img.shields.io/badge/React-19.0.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini_AI-2.5_Flash-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

**Next-Generation Cyber Threat Email Forensics, Attack Graph Intelligence & Cryptographic Evidence Ledger Platform**

[Key Features](#-key-features) • [System Architecture](#-system-architecture) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [API Documentation](#-api-documentation) • [Legal Admissibility](#-chain-of-custody--legal-admissibility) • [Deployment](#-deployment)

</div>

---

## 📌 Executive Overview

Modern spear-phishing, Business Email Compromise (BEC), and credential harvesting campaigns exploit advanced obfuscation, multi-stage redirect chains, lookalike domains, and compromised routing infrastructure. Manual inspection of raw RFC 822 MIME headers and multi-hop transport paths is time-consuming, prone to human error, and difficult to preserve for formal legal proceedings.

**TracPhish** is an enterprise-grade cyber forensics workstation designed for Security Operations Centers (SOC), incident responders, and digital forensics teams. It combines **deep RFC 822 MIME parsing**, **multi-hop Geo-IP route tracing**, **interactive threat graph modeling**, **multi-model LLM triage cascades (Google Gemini)**, and an **immutable SHA-256 cryptographic chain of custody ledger** to automate end-to-end email threat analysis.

---

## ✨ Key Features

### 🤖 Multi-Tier AI Triage & Cascade Fallback
- Analyzes sender authenticity, domain anomalies, urgency lures, social engineering phrases, and intent.
- **Failover Engine**: Intelligently cycles through `gemini-2.5-flash` ➔ `gemini-2.0-flash` ➔ `gemini-1.5-flash` ➔ `gemini-1.5-flash-8b`.
- **Zero-Downtime Deterministic Fallback**: If LLM quotas are exhausted or external APIs are unreachable, a deterministic heuristic engine analyzes SPF/DKIM/DMARC flags, header anomalies, and regex patterns to deliver uninterrupted forensic triage.

### 🔬 Deep Header Forensics & RFC 822 Parsing
- Comprehensive extraction of RFC 822 / MIME email headers from raw `.eml` and `.msg` files.
- Inspects email authentication records: **SPF** (Sender Policy Framework), **DKIM** (DomainKeys Identified Mail), and **DMARC** (Domain-based Message Authentication, Reporting, and Conformance).
- Traces intermediate `Received:` headers to reconstruct the full routing transit path from origin MTA to recipient.

### 🗺️ Interactive Multi-Hop Geo-IP Route Mapping
- Dark-themed geographic map (powered by Leaflet & OpenStreetMap) visualizing physical server coordinates for every transit hop.
- Global dashboard overview displaying incident origins worldwide.
- Per-case dedicated side-by-side geographic map detailing specific origin nodes and routing paths.

### 🕸️ Threat & Infrastructure Graph
- Interactive visual graph built with **React Flow** (`@xyflow/react`).
- Maps out relationships between **Cases**, **Emails**, **Sender Mailboxes**, **Origin Domains**, **IP Addresses**, and **Geographic Nodes**.
- Facilitates rapid visual root-cause discovery and threat infrastructure cluster correlation.

### ⛓️ Cryptographic Chain of Custody Evidence Ledger
- Built-in blockchain-style tamper-evident ledger powered by the Web Crypto API (`crypto.subtle`) and Node.js `crypto`.
- Every upload, header parsing event, and triage calculation is signed into a sequential SHA-256 hash block (`Block[N].hash = SHA256(Block[N-1].hash + timestamp + caseId + event + data)`).
- **Dual-Verification Engine**: Supports one-click mathematical integrity validation both client-side and server-side.
- Compliant with digital evidence integrity principles (US Federal Rules of Evidence 902(13)/(14) & Indian Evidence Act Section 65B).

### 📄 Enterprise Forensic PDF Report Generator
- Client-side, high-resolution vector PDF generator powered by `jsPDF`.
- Generates publication-ready, multi-page forensic dossiers complete with executive summaries, risk scores, authentication status tables, routing hop breakdowns, and cryptographic chain-of-custody audit logs.

### 🧪 One-Click Demo Triage
- Built-in pre-configured attack vectors to test and demonstrate capabilities without uploading sensitive files:
  - **Business Email Compromise (BEC)**: Executive impersonation, wire transfer fraud, and failing SPF/DKIM.
  - **Credential Phishing**: Lookalike domains, deceptive brand styling, and suspicious transit infrastructure.
  - **Legitimate Communication**: Clean baseline internal company emails with verified authentication passes.

---

## 🏛️ System Architecture

```
                                  [ User / Analyst ]
                                          │
                        ┌─────────────────┴─────────────────┐
                        ▼                                   ▼
              Upload .eml / .msg                   Select Built-in Demo
                        │                                   │
                        └─────────────────┬─────────────────┘
                                          ▼
                         [ Express / Multer In-Memory ]
                                          │
                                 mailparser (RFC 822)
                                          │
                  ┌───────────────────────┼───────────────────────┐
                  ▼                       ▼                       ▼
          [ Auth Verification ]    [ Routing Hops ]       [ Payload & Headers ]
          (SPF / DKIM / DMARC)    (IPs, MTAs, Delays)      (Text, HTML, Attachments)
                  │                       │                       │
                  └───────────────────────┼───────────────────────┘
                                          ▼
                               [ Geo-IP Coordinates ]
                                          │
                                          ▼
                     [ Multi-Tier Forensic Triage Engine ]
                                          │
                 ┌────────────────────────┴────────────────────────┐
                 ▼ (Primary)                                       ▼ (Fallback)
         Google Gemini AI                                 Deterministic Heuristic
   (2.5-Flash ➔ 2.0 ➔ 1.5)                                   Forensic Engine
                 │                                                 │
                 └────────────────────────┬────────────────────────┘
                                          ▼
                         [ SHA-256 Evidence Ledger Block ]
                          (Chain of Custody Timestamping)
                                          │
                        ┌─────────────────┴─────────────────┐
                        ▼                                   ▼
             [ Interactive UI & Graph ]             [ Export Dossier ]
        (React 19, React Flow, Leaflet)           (High-Resolution jsPDF)
```

---

## 💻 Tech Stack

| Layer | Technologies | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19, TypeScript, Vite 6 | High-performance reactive interface with strict type safety |
| **Styling & Motion** | Tailwind CSS v4, Motion (Framer Motion v12) | Modern dark-mode cyber aesthetic with smooth micro-interactions |
| **Graph Visualization** | React Flow (`@xyflow/react`) | Node-based interactive attack tree and infrastructure network |
| **Geographic Mapping** | Leaflet, React-Leaflet, OpenStreetMap | Interactive dark-filtered multi-hop IP transit trajectory maps |
| **Backend & Ingestion** | Node.js, Express 4, Multer, `mailparser` | In-memory RFC 822 stream parsing and RESTful API endpoints |
| **Forensic AI** | `@google/genai` (Gemini 2.5 / 2.0 / 1.5 Flash) | Contextual threat classification, intent analysis, and risk scoring |
| **Cryptographic Ledger** | Native Web Crypto API & Node.js `crypto` | SHA-256 continuous block hash chain of custody ledger |
| **Dossier Generation** | `jsPDF` | Client-side, high-resolution vector PDF forensic audit report generation |
| **Deployment** | Vercel Serverless Functions + `esbuild` | Dual runtime bundling for local dev and cloud serverless hosting |

---

## 📂 Project Structure

```
tracphish/
├── api/
│   └── index.js             # Bundled serverless entrypoint for Vercel
├── src/
│   ├── components/
│   │   ├── CaseDetail.tsx   # Case breakdown, email metadata, Leaflet map & graph
│   │   ├── Dashboard.tsx    # Global threat metrics, recent cases & world map
│   │   ├── Evidence.tsx     # Cryptographic chain of custody ledger & verifier
│   │   ├── Ingestion.tsx    # .eml/.msg file uploader & demo case launcher
│   │   └── Reports.tsx      # Multi-case report center with PDF export actions
│   ├── utils/
│   │   ├── pdfGenerator.ts  # Multi-page vector PDF forensic dossier generator
│   │   └── storage.ts       # Client state, local storage sync & fallback ledger
│   ├── App.tsx              # Application layout, top navigation & view routing
│   ├── main.tsx             # React 19 root entry
│   └── index.css            # Tailwind CSS v4 design tokens and theme layers
├── server.ts                # Express backend, Gemini cascade, mailparser & APIs
├── vercel.json              # Vercel serverless routing and rewrite rules
├── vite.config.ts           # Vite bundler configuration
└── package.json             # Project dependencies and build scripts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Google Gemini API Key**: Obtain a free or paid key from [Google AI Studio](https://aistudio.google.com/).

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/apurvakumar17/tracphish.git
   cd tracphish
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the project root:
   ```env
   # Gemini API Key (Required for AI features)
   GEMINI_API_KEY="your_actual_gemini_api_key_here"

   # Preferred Gemini Model (Optional, defaults to gemini-2.5-flash with automatic cascade)
   GEMINI_MODEL="gemini-2.5-flash"

   # App URL (Optional, defaults to localhost)
   APP_URL="http://localhost:3000"
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to **`http://localhost:3000`**.

---

## ⚙️ Environment Variables

| Variable | Required | Default | Purpose |
| :--- | :---: | :---: | :--- |
| `GEMINI_API_KEY` | **Yes** | — | Google Gemini API key used for automated threat triage and classification |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Primary Gemini model candidate (falls back to 2.0 / 1.5 automatically) |
| `APP_URL` | No | `http://localhost:3000` | Hostname used for absolute links and callback endpoints |
| `PORT` | No | `3000` | Port for the local Express server |

---

## 🔌 API Documentation

All API endpoints are prefixed with `/api`.

### 1. Ingest & Analyze Email
- **Endpoint**: `POST /api/analyze`
- **Content-Type**: `multipart/form-data`
- **Body**: File upload with field name `file` (`.eml` or `.msg`).
- **Response**: Full forensic case object containing parsed headers, auth results (SPF/DKIM/DMARC), routing hops, Geo-IP data, AI triage assessment, attack graph nodes/edges, and initial cryptographic ledger block.

### 2. Generate Simulated Demo Case
- **Endpoint**: `POST /api/analyze/demo?type=bec|phishing|legit`
- **Response**: Complete synthetic forensic case ready for immediate triage without external file requirements.

### 3. Retrieve All Cases
- **Endpoint**: `GET /api/cases`
- **Response**: Array of all registered investigation cases.

### 4. Retrieve Case by ID
- **Endpoint**: `GET /api/cases/:id`
- **Response**: Single case record including associated evidence ledger blocks.

### 5. Retrieve Evidence Ledger
- **Endpoint**: `GET /api/evidence/:caseId`
- **Response**: Array of sequential SHA-256 signed evidence blocks for the specified case.

### 6. Verify Evidence Ledger Integrity
- **Endpoint**: `POST /api/evidence/verify`
- **Body**: `{ "blocks": [ ... ] }` (Optional; defaults to server ledger if omitted).
- **Response**: `{ "verified": true|false, "blockCount": number }`.

### 7. Download Forensic Summary
- **Endpoint**: `GET /api/report/:caseId`
- **Response**: Forensic summary text artifact attachment. *(Interactive vector PDF reports can also be downloaded directly in the UI).*

---

## ⚖️ Chain of Custody & Legal Admissibility

In cybercrime investigations and corporate litigation, evidence must withstand legal scrutiny regarding provenance and immutability. TracPhish enforces a strict digital chain of custody:

1. **Immediate Hash Ingestion**: Upon file upload, the raw binary buffer is hashed using SHA-256 before parsing.
2. **Sequential Block Linking**: Each subsequent lifecycle event (parsing, triage, manual notes) generates a discrete block containing:
   $$\text{Block Hash} = \text{SHA-256}(\text{PreviousHash} + \text{Timestamp} + \text{CaseID} + \text{EventType} + \text{Data})$$
3. **Tamper Detection**: If any block payload or timestamp is modified, the cryptographic hash chain breaks, immediately failing validation.
4. **Standards Alignment**:
   - **Federal Rules of Evidence (FRE) Rule 902(13) & (14)**: Certified records generated by an electronic process or system.
   - **Indian Evidence Act Section 65B**: Electronic record admissibility through verifiable hash and custody audit trails.
   - **ISO/IEC 27037**: Guidelines for identification, collection, acquisition, and preservation of digital evidence.

---

## 🚢 Deployment

### Deploying to Vercel

The project is pre-configured with `vercel.json` and a dedicated serverless bundle script:

1. **Build the Production Package**:
   ```bash
   npm run build
   ```
   This compiles the Vite frontend into `/dist` and bundles the Express API into `/api/index.js` using `esbuild`.

2. **Deploy with Vercel CLI**:
   ```bash
   npx vercel
   ```

3. **Set Environment Variables in Vercel Dashboard**:
   - Add `GEMINI_API_KEY` in your Vercel Project Settings under **Environment Variables**.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
Developed with ❤️ for the Cybersecurity and Digital Forensics Community.
</div>
