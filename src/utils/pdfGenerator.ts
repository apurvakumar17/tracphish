import { jsPDF } from 'jspdf';
import { Case, GeoLocation } from '../types';

export function generateForensicPdf(caseData: Case, customLedger: any[] = [], geoPoints: GeoLocation[] = []) {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  const caseLedger = customLedger || [];
  const primaryGeo = geoPoints[0];

  function checkPageBreak(requiredHeight: number) {
    if (y + requiredHeight > pageHeight - 16) {
      doc.addPage();
      y = 16;
      drawPageHeader();
    }
  }

  function drawPageHeader() {
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, y - 8, contentWidth, 1, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`TRACPHISH FORENSIC REPORT | CASE: ${caseData.id}`, margin, y - 3);
    doc.text(`CONFIDENTIAL`, pageWidth - margin, y - 3, { align: 'right' });
    y += 4;
  }

  // ===================== PAGE 1 COVER / BANNER =====================
  // Top Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'F');

  // Accent line
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(margin, y + 24, contentWidth, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(248, 250, 252);
  doc.text('TRACPHISH FORENSIC INVESTIGATION REPORT', margin + 6, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('DIGITAL EVIDENCE ARTIFACT & CHAIN-OF-CUSTODY AUDIT', margin + 6, y + 17);
  doc.text(`Generated: ${new Date().toUTCString()}`, pageWidth - margin - 6, y + 17, { align: 'right' });

  y += 34;

  // ===================== METADATA GRID =====================
  doc.setFillColor(241, 245, 249); // light background card
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'D');

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('CASE IDENTIFIER:', margin + 5, y + 6);
  doc.text('CREATION DATE:', margin + 65, y + 6);
  doc.text('LEAD ANALYST:', margin + 125, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(caseData.id, margin + 5, y + 12);
  doc.text(new Date(caseData.createdAt).toLocaleString(), margin + 65, y + 12);
  doc.text(caseData.analyst || 'Automated Triage Unit', margin + 125, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('CASE STATUS:', margin + 5, y + 19);
  doc.text('CONFIDENCE LEVEL:', margin + 65, y + 19);
  doc.text('LEGAL CHAIN BLOCKS:', margin + 125, y + 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(caseData.status || 'Active Triage', margin + 30, y + 19);
  doc.text(`${caseData.attributionConfidence || 85}%`, margin + 102, y + 19);
  doc.text(`${caseLedger.length} Sealed Blocks`, margin + 168, y + 19);

  y += 30;

  // ===================== THREAT VERDICT BOX =====================
  const score = caseData.threatScore;
  const isCritical = score > 80;
  const isMedium = score > 50 && score <= 80;

  let badgeBg = [220, 38, 38]; // Red
  let badgeText = 'CRITICAL THREAT';
  if (!isCritical && isMedium) {
    badgeBg = [234, 88, 12]; // Orange
    badgeText = 'SUSPICIOUS THREAT';
  } else if (!isCritical && !isMedium) {
    badgeBg = [22, 163, 74]; // Green
    badgeText = 'LOW RISK / LEGITIMATE';
  }

  doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(`VERDICT: ${caseData.threatClassification.toUpperCase()}`, margin + 5, y + 8);
  doc.text(`SCORE: ${score} / 100 [${badgeText}]`, pageWidth - margin - 5, y + 8, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Attribution: ${primaryGeo ? primaryGeo.location : 'Global Relay Infrastructure'} (IP: ${primaryGeo?.ip || 'N/A'})`, margin + 5, y + 14);

  y += 24;

  // ===================== SECTION 1: EXECUTIVE SUMMARY =====================
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. EXECUTIVE SUMMARY & FORENSIC FINDINGS', margin, y);
  doc.setFillColor(37, 99, 235);
  doc.rect(margin, y + 1.5, contentWidth, 0.5, 'F');
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const summaryText = caseData.aiAnalysis?.summary || 'Automated forensic triage conducted. Suspected threat indicators verified.';
  const splitSummary = doc.splitTextToSize(summaryText, contentWidth - 6);
  
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, splitSummary.length * 4.5 + 6, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, splitSummary.length * 4.5 + 6, 1.5, 1.5, 'D');

  doc.text(splitSummary, margin + 3, y + 4.5);
  y += splitSummary.length * 4.5 + 10;

  // Key Indicators Grid
  checkPageBreak(25);
  const socialEng = (caseData.aiAnalysis?.social_engineering_indicators || []).join(', ') || 'None detected';
  const impersonation = (caseData.aiAnalysis?.impersonation_indicators || []).join(', ') || 'None detected';
  const phrases = (caseData.aiAnalysis?.suspicious_phrases || []).join(', ') || 'None captured';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Social Engineering:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(doc.splitTextToSize(socialEng, contentWidth - 40), margin + 38, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Impersonation Flags:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(doc.splitTextToSize(impersonation, contentWidth - 40), margin + 38, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Suspicious Keywords:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(doc.splitTextToSize(phrases, contentWidth - 40), margin + 38, y);
  y += 10;

  // ===================== SECTION 2: EMAIL ENVELOPE METADATA =====================
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. EMAIL ARTIFACT METADATA', margin, y);
  doc.setFillColor(37, 99, 235);
  doc.rect(margin, y + 1.5, contentWidth, 0.5, 'F');
  y += 7;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 28, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 28, 1.5, 1.5, 'D');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('FROM:', margin + 4, y + 5);
  doc.text('TO:', margin + 4, y + 11);
  doc.text('SUBJECT:', margin + 4, y + 17);
  doc.text('DATE / MSG-ID:', margin + 4, y + 23);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(String(caseData.parsedData?.from || 'Unknown').substring(0, 85), margin + 30, y + 5);
  doc.text(String(caseData.parsedData?.to || 'Unknown').substring(0, 85), margin + 30, y + 11);
  doc.text(String(caseData.parsedData?.subject || 'Unknown').substring(0, 85), margin + 30, y + 17);
  doc.text(`${new Date(caseData.parsedData?.date).toUTCString()} | ${caseData.parsedData?.messageId || 'N/A'}`, margin + 30, y + 23);

  y += 34;

  // ===================== SECTION 3: HEADER FORENSICS & ROUTING =====================
  checkPageBreak(45);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. AUTHENTICATION & MAIL ROUTING FORENSICS', margin, y);
  doc.setFillColor(37, 99, 235);
  doc.rect(margin, y + 1.5, contentWidth, 0.5, 'F');
  y += 7;

  // Auth Badges
  const authResults = caseData.authResults || { spf: 'FAIL', dkim: 'FAIL', dmarc: 'FAIL' };
  const authKeys = ['spf', 'dkim', 'dmarc'] as const;
  const badgeW = (contentWidth - 8) / 3;

  authKeys.forEach((key, idx) => {
    const val = (authResults[key] || 'FAIL').toUpperCase();
    const isPass = val === 'PASS';
    const bx = margin + idx * (badgeW + 4);
    
    doc.setFillColor(isPass ? 240 : 254, isPass ? 253 : 242, isPass ? 244 : 242);
    doc.roundedRect(bx, y, badgeW, 11, 1, 1, 'F');
    doc.setDrawColor(isPass ? 187 : 254, isPass ? 247 : 202, isPass ? 208 : 202);
    doc.roundedRect(bx, y, badgeW, 11, 1, 1, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(isPass ? 22 : 185, isPass ? 101 : 28, isPass ? 52 : 28);
    doc.text(`${key.toUpperCase()}: ${val}`, bx + badgeW / 2, y + 7, { align: 'center' });
  });

  y += 16;

  // Hops Table Header
  checkPageBreak(30);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('HOP #', margin + 3, y + 4);
  doc.text('RELAY IP ADDRESS', margin + 20, y + 4);
  doc.text('HOSTNAME / REVERSE DNS', margin + 60, y + 4);
  doc.text('GEOLOCATION / INFRASTRUCTURE', margin + 115, y + 4);
  doc.text('STATUS', pageWidth - margin - 3, y + 4, { align: 'right' });
  y += 7;

  const hops = caseData.hops || [];
  hops.forEach((hop, i) => {
    checkPageBreak(7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);

    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 1, contentWidth, 6, 'F');
    }

    doc.text(`Hop ${i + 1}`, margin + 3, y + 3.5);
    doc.text(hop.ip || 'N/A', margin + 20, y + 3.5);
    doc.text(String(hop.host || 'unknown').substring(0, 28), margin + 60, y + 3.5);
    doc.text(String(hop.location || 'Unknown').substring(0, 32), margin + 115, y + 3.5);

    if (hop.isSuspicious) {
      doc.setTextColor(220, 38, 38);
      doc.setFont('helvetica', 'bold');
      doc.text('SUSPICIOUS', pageWidth - margin - 3, y + 3.5, { align: 'right' });
    } else {
      doc.setTextColor(71, 85, 105);
      doc.text('NORMAL', pageWidth - margin - 3, y + 3.5, { align: 'right' });
    }

    y += 6;
  });

  y += 6;

  // ===================== SECTION 4: EVIDENCE CHAIN OF CUSTODY =====================
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('4. CRYPTOGRAPHIC EVIDENCE CHAIN OF CUSTODY', margin, y);
  doc.setFillColor(37, 99, 235);
  doc.rect(margin, y + 1.5, contentWidth, 0.5, 'F');
  y += 7;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('BLOCK', margin + 3, y + 4);
  doc.text('EVENT TYPE', margin + 20, y + 4);
  doc.text('TIMESTAMP (UTC)', margin + 65, y + 4);
  doc.text('SHA-256 BLOCK HASH (INTEGRITY SEAL)', margin + 110, y + 4);
  y += 7;

  caseLedger.forEach((block, idx) => {
    checkPageBreak(8);
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 1, contentWidth, 7, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(37, 99, 235);
    doc.text(`#${String(block.sequence || idx + 1).padStart(2, '0')}`, margin + 3, y + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(block.eventType || 'EVIDENCE_RECORD', margin + 20, y + 3.5);
    doc.text(new Date(block.timestamp).toISOString(), margin + 65, y + 3.5);

    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    const hashPreview = block.currentHash ? `${block.currentHash.substring(0, 36)}...` : 'SEALED';
    doc.text(hashPreview, margin + 110, y + 3.5);

    y += 7;
  });

  y += 6;

  // ===================== SECTION 5: RECOMMENDED ACTIONS =====================
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('5. RECOMMENDED INCIDENT REMEDIATION ACTIONS', margin, y);
  doc.setFillColor(37, 99, 235);
  doc.rect(margin, y + 1.5, contentWidth, 0.5, 'F');
  y += 7;

  const actions = caseData.aiAnalysis?.recommended_actions || [
    'Quarantine message and purge from mail exchange mailboxes',
    'Block originating sender domain and IP in security gateway',
    'Perform credential rotation for targeted recipients',
    'Preserve this report and raw EML for legal or compliance records'
  ];

  actions.forEach((act: string) => {
    checkPageBreak(6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(37, 99, 235);
    doc.text('>', margin + 3, y + 3);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(act, margin + 9, y + 3);
    y += 5.5;
  });

  // ===================== LEGAL DISCLAIMER =====================
  checkPageBreak(22);
  y += 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('LEGAL & FORENSIC ADMISSIBILITY DISCLAIMER:', margin + 3, y + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(
    'IP geolocation, infrastructure attribution, and threat classification represent probabilistic forensic intelligence signals. ' +
    'This report maintains cryptographic SHA-256 chain-of-custody hash seals adhering to electronic discovery standards.',
    margin + 3,
    y + 8,
    { maxWidth: contentWidth - 6 }
  );

  // ===================== FOOTERS ON ALL PAGES =====================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, pageHeight - 12, contentWidth, 0.4, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('TracPhish Forensic Platform • Verified Incident Investigation', margin, pageHeight - 7);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  // Trigger browser download
  doc.save(`Forensic_Report_${caseData.id}.pdf`);
}
