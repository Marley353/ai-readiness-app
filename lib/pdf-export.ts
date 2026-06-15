// PDF report generation + email composition for assessments.
// Extracted from components/ai-readiness-scorecard.tsx (M2.3) so the
// 600-line jsPDF layout lives outside the UI component.

import jsPDF from "jspdf";
import {
  type Assessment, type ScoreValue,
  SECTORS, COMPANY_SIZES, COMPLEXITY_LEVELS, PILLARS,
  getWeightedPillarScore, getWeightedOverallScore,
  getRiskScore, getBusinessImpact, getROIOpportunity, getBand,
  getTopOpportunities, getTopRisks, generateExecutiveSummary,
} from "@/lib/scoring";
import { getExternalMaturityLabel } from "@/lib/maturity-labels";

export function exportPdf(assessment: Assessment, options: { watermark?: boolean } = {}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const MARGIN = 16;
  const CONTENT_W = W - MARGIN * 2;
  const overall = getWeightedOverallScore(assessment);
  const band = getBand(overall);
  const risk = getRiskScore(assessment);
  const impact = getBusinessImpact(assessment);
  const roi = getROIOpportunity(assessment);
  const sector = SECTORS.find((s) => s.value === assessment.sector);
  const topOpps = getTopOpportunities(assessment);
  const topRisks = getTopRisks(assessment);
  const pillarScores = PILLARS.map((p) => ({ title: p.title, score: getWeightedPillarScore(p, assessment.scores), rec: p.strategicRecommendations[assessment.sector], impact: p.businessImpact }));
  const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  // ── Text-sizing helpers (prevent overrun inside fixed-width boxes/pills) ─────

  // Truncate text with an ellipsis so it fits within maxW at the current font
  const fitText = (text: string, maxW: number): string => {
    if (doc.getTextWidth(text) <= maxW) return text;
    let t = text;
    while (t.length > 1 && doc.getTextWidth(t + "…") > maxW) {
      t = t.slice(0, -1);
    }
    return t.trim() + "…";
  };

  // Draw a pill that auto-sizes to its text. Returns the pill width so callers
  // can chain layout. `anchorX` is treated as the LEFT edge; pass alignRight=true
  // to have `anchorX` mean the RIGHT edge instead.
  const drawPill = (
    text: string,
    anchorX: number,
    y: number,
    opts: {
      h?: number;
      padX?: number;
      fontSize?: number;
      fill: [number, number, number];
      color: [number, number, number];
      alignRight?: boolean;
      maxW?: number;
    },
  ): number => {
    const h = opts.h ?? 7;
    const padX = opts.padX ?? 3;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(opts.fontSize ?? 7);
    const textW = Math.min(doc.getTextWidth(text), opts.maxW ?? 60);
    const pillW = textW + padX * 2;
    const pillX = opts.alignRight ? anchorX - pillW : anchorX;
    doc.setFillColor(...opts.fill);
    doc.roundedRect(pillX, y, pillW, h, 2, 2, "F");
    doc.setTextColor(...opts.color);
    doc.text(fitText(text, opts.maxW ?? textW), pillX + pillW / 2, y + h / 2 + 1.6, { align: "center" });
    return pillW;
  };

  const addPageFooter = (pageNum: number) => {
    doc.setFillColor(30, 27, 75);
    doc.rect(0, 285, W, 12, "F");
    doc.setTextColor(255, 183, 112);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("AI Transformation Readiness Report — Confidential", MARGIN, 292);
    doc.text(`Page ${pageNum}`, W - MARGIN, 292, { align: "right" });
  };

  const scoreColor = (s: number): [number, number, number] =>
    s >= 70 ? [5, 150, 105] : s >= 50 ? [8, 145, 178] : s >= 30 ? [217, 119, 6] : [239, 68, 68];

  // ─── PAGE 1: COVER ───────────────────────────────────────────────────────────
  doc.setFillColor(30, 27, 75); // deep indigo
  doc.rect(0, 0, W, 297, "F");

  // Accent bar - indigo gradient effect (solid color simulation)
  doc.setFillColor(196, 102, 26);
  doc.rect(0, 0, 6, 297, "F");

  // Logo / brand strip
  doc.setTextColor(255, 183, 112);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("AI READINESS · 8-DIMENSION ENTERPRISE FRAMEWORK", MARGIN + 6, 22);

  // Main title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.text("AI Transformation", MARGIN + 6, 80);
  doc.text("Readiness Report", MARGIN + 6, 94);

  // Divider
  doc.setFillColor(196, 102, 26);
  doc.rect(MARGIN + 6, 100, 80, 1.5, "F");

  // Org name
  doc.setFontSize(16);
  doc.setTextColor(226, 232, 240);
  doc.text(assessment.businessName || "Organisation Not Specified", MARGIN + 6, 114);

  // Meta grid
  const meta = [
    ["Sector", sector?.label || "General"],
    ["Assessor", assessment.assessor || "Not specified"],
    ["Assessment", assessment.name],
    ["Date", dateStr],
  ];
  let metaY = 134;
  meta.forEach(([label, value]) => {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "bold");
    doc.text(label.toUpperCase(), MARGIN + 6, metaY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text(value, MARGIN + 6, metaY + 5);
    metaY += 14;
  });

  // Score circle (drawn as text block)
  const [sr, sg, sb] = scoreColor(overall);
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(sr, sg, sb);
  doc.setLineWidth(3);
  doc.circle(W - 50, 120, 30, "D");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(`${overall}%`, W - 50, 117, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(sr, sg, sb);
  doc.text("READINESS", W - 50, 124, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text(`${getExternalMaturityLabel(band.label)} (${band.label})`, W - 50, 132, { align: "center" });

  // Bottom strip
  doc.setFillColor(20, 184, 166, 0.15);
  doc.setFillColor(27, 25, 56);
  doc.rect(0, 265, W, 32, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("This report is confidential and intended solely for the named organisation. Scores are based on responses provided during the assessment.", MARGIN + 6, 275, { maxWidth: CONTENT_W - 6 });

  addPageFooter(1);

  // ─── PAGE 2: EXECUTIVE SUMMARY ───────────────────────────────────────────────
  doc.addPage();

  const sectionHeader = (title: string, y: number): number => {
    doc.setFillColor(30, 27, 75);
    doc.rect(0, y - 6, W, 14, "F");
    doc.setFillColor(196, 102, 26);
    doc.rect(0, y - 6, 4, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title, MARGIN, y + 3);
    return y + 16;
  };

  let y = 18;
  y = sectionHeader("EXECUTIVE SUMMARY", y);

  // Score overview boxes (4-up)
  const kpis = [
    { label: "AI Readiness Score", value: `${overall}%`, sub: `${getExternalMaturityLabel(band.label)} (${band.label})`, c: scoreColor(overall) },
    { label: "Risk Level", value: risk.level.charAt(0).toUpperCase() + risk.level.slice(1), sub: `Score ${risk.score}/100`, c: risk.level === "high" ? [239, 68, 68] as [number,number,number] : risk.level === "medium" ? [217, 119, 6] as [number,number,number] : [5, 150, 105] as [number,number,number] },
    { label: "Business Impact", value: impact.category.split(" ")[0], sub: impact.category, c: [8, 145, 178] as [number,number,number] },
    { label: "ROI Opportunity", value: roi.range, sub: `${roi.confidence} confidence`, c: [13, 148, 136] as [number,number,number] },
  ];
  const boxW = (CONTENT_W - 9) / 4;
  const KPI_BOX_H = 26; // taller box so sub-text fits on 2 lines if needed
  kpis.forEach((kpi, i) => {
    const bx = MARGIN + i * (boxW + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(bx, y, boxW, KPI_BOX_H, 2, 2, "FD");
    doc.setFillColor(...kpi.c);
    doc.rect(bx, y, boxW, 1.5, "F");

    // Label (small, top)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, bx + boxW / 2, y + 6, { align: "center" });

    // Value (big, middle). Shrink-to-fit so long values like the ROI range
    // "15-25%" always fit the ~45mm box without clipping.
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...kpi.c);
    let valueSize = 14;
    doc.setFontSize(valueSize);
    while (doc.getTextWidth(kpi.value) > boxW - 4 && valueSize > 8) {
      valueSize -= 1;
      doc.setFontSize(valueSize);
    }
    doc.text(kpi.value, bx + boxW / 2, y + 13, { align: "center" });

    // Sub (wrapped to up to 2 lines, ellipsised if still too long)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    const subLines = (doc.splitTextToSize(kpi.sub, boxW - 4) as string[]).slice(0, 2);
    if (subLines.length === 2 && doc.splitTextToSize(kpi.sub, boxW - 4).length > 2) {
      subLines[1] = fitText(subLines[1], boxW - 4);
    }
    subLines.forEach((line, li) => {
      doc.text(line, bx + boxW / 2, y + 19 + li * 3.5, { align: "center" });
    });
  });
  y += KPI_BOX_H + 6;

  // Summary narrative
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  const narrative = doc.splitTextToSize(generateExecutiveSummary(assessment).slice(0, 700), CONTENT_W);
  doc.text(narrative, MARGIN, y);
  y += narrative.length * 4.5 + 6;

  // ─── PILLAR SCORES ───────────────────────────────────────────────────────────
  y += 6;
  if (y + 40 > 275) { doc.addPage(); addPageFooter(doc.getNumberOfPages()); y = 18; }
  y = sectionHeader("PILLAR SCORES (WEIGHTED)", y);

  pillarScores.forEach((pillar) => {
    const [pr, pg, pb] = scoreColor(pillar.score);

    // Title (truncated to leave room for score on the right)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    const titleMaxW = CONTENT_W - 22; // reserve ~22mm on the right for the score
    doc.text(fitText(pillar.title, titleMaxW), MARGIN, y + 4);

    // Score (right-aligned)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(pr, pg, pb);
    doc.text(`${pillar.score}%`, W - MARGIN, y + 4, { align: "right" });

    // Bar track
    const barX = MARGIN;
    const barW = CONTENT_W;
    const barH = 3;
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(barX, y + 6, barW, barH, 1, 1, "F");
    doc.setFillColor(pr, pg, pb);
    const filled = Math.max(2, (pillar.score / 100) * barW);
    doc.roundedRect(barX, y + 6, filled, barH, 1, 1, "F");

    // Impact line (wrapped to up to 2 lines)
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    const impactLines = (doc.splitTextToSize(pillar.impact, CONTENT_W) as string[]).slice(0, 2);
    impactLines.forEach((line, li) => doc.text(line, MARGIN, y + 13 + li * 3));
    const rowH = 13 + impactLines.length * 3 + 3;

    // Page break if needed (check BEFORE drawing)
    if (y + rowH > 275) {
      doc.addPage();
      addPageFooter(doc.getNumberOfPages());
      y = 18;
    } else {
      y += rowH;
    }
  });

  addPageFooter(2);

  // ─── PAGE 3: BUSINESS PROFILE + OPPORTUNITIES + RISKS ────────────────────────
  doc.addPage();
  y = 18;
  y = sectionHeader("BUSINESS PROFILE", y);

  const profile = [
    ["Organisation", assessment.businessName || "Not specified"],
    ["Sector", sector?.label || "General"],
    ["Company Size", COMPANY_SIZES.find(s => s.value === assessment.companySize)?.label || "Not specified"],
    ["Sites", assessment.numberOfSites || "Not specified"],
    ["Annual Revenue", assessment.annualRevenue || "Not specified"],
    ["Operational Complexity", COMPLEXITY_LEVELS.find(c => c.value === assessment.operationalComplexity)?.label || "Not specified"],
  ];
  const colW = (CONTENT_W - 4) / 2;
  profile.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const px = MARGIN + col * (colW + 4);
    const py = y + row * 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), px, py);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(value, px, py + 5);
  });
  y += Math.ceil(profile.length / 2) * 12 + 6;

  if (assessment.notes.trim()) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    const noteLines = doc.splitTextToSize(assessment.notes, CONTENT_W - 8);
    doc.roundedRect(MARGIN, y, CONTENT_W, noteLines.length * 4.5 + 10, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("ASSESSOR NOTES", MARGIN + 4, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(noteLines, MARGIN + 4, y + 12);
    y += noteLines.length * 4.5 + 16;
  }

  // Opportunities
  y += 6;
  if (y + 40 > 275) { doc.addPage(); addPageFooter(doc.getNumberOfPages()); y = 18; }
  y = sectionHeader("TOP AI OPPORTUNITIES", y);
  topOpps.forEach((opp, i) => {
    // Measure the impact pill first so we know how much horizontal space the title has
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    const impactPillW = Math.min(doc.getTextWidth(opp.impact) + 6, 50);
    const impactPillGap = 4;

    // Title available width: card width, minus left bar + left padding + pill + gap + right padding
    const titleMaxW = CONTENT_W - 8 - 4 - impactPillW - impactPillGap - 4;

    // Title (wrap to up to 2 lines — retains full title if possible)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    const titleLines = (doc.splitTextToSize(`${i + 1}. ${opp.title}`, titleMaxW) as string[]).slice(0, 2);

    // Description (wrap to full card width now that pill is above the copy)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const oppLines = doc.splitTextToSize(opp.description, CONTENT_W - 12) as string[];

    // Dynamic box height
    const boxH = titleLines.length * 4.5 + oppLines.length * 4 + 10;

    if (y + boxH > 275) { doc.addPage(); addPageFooter(doc.getNumberOfPages()); y = 18; }

    // Card background
    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(153, 246, 228);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 2, 2, "FD");

    // Left accent bar
    doc.setFillColor(5, 150, 105);
    doc.roundedRect(MARGIN, y, 4, boxH, 1, 1, "F");

    // Impact pill (auto-sized, top-right of the card)
    drawPill(opp.impact, W - MARGIN - 2, y + 3, {
      fill: [209, 250, 229],
      color: [6, 95, 70],
      alignRight: true,
      maxW: 46,
      padX: 3,
      h: 6,
      fontSize: 6.5,
    });

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(6, 95, 70);
    titleLines.forEach((line, li) => doc.text(line, MARGIN + 8, y + 6 + li * 4.5));

    // Description
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(15, 79, 58);
    doc.text(oppLines, MARGIN + 8, y + 6 + titleLines.length * 4.5 + 4);

    y += boxH + 4;
  });

  // Risks
  y += 6;
  if (y + 40 > 275) { doc.addPage(); addPageFooter(doc.getNumberOfPages()); y = 18; }
  y = sectionHeader("KEY RISKS IF NO ACTION TAKEN", y);
  topRisks.forEach((r, i) => {
    const isHigh = r.severity === "High";
    const severityFill: [number, number, number] = isHigh ? [254, 226, 226] : [254, 243, 199];
    const severityColor: [number, number, number] = isHigh ? [153, 27, 27] : [146, 64, 10];

    // Measure severity pill
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    const sevPillW = Math.min(doc.getTextWidth(r.severity) + 6, 26);
    const titleMaxW = CONTENT_W - 8 - 4 - sevPillW - 4 - 4;

    // Title + description lines
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    const rTitleLines = (doc.splitTextToSize(`${i + 1}. ${r.title}`, titleMaxW) as string[]).slice(0, 2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const rLines = doc.splitTextToSize(r.description, CONTENT_W - 12) as string[];

    const boxH = rTitleLines.length * 4.5 + rLines.length * 4 + 10;

    if (y + boxH > 275) { doc.addPage(); addPageFooter(doc.getNumberOfPages()); y = 18; }

    // Card background
    doc.setFillColor(isHigh ? 255 : 255, isHigh ? 241 : 251, isHigh ? 242 : 235);
    doc.setDrawColor(isHigh ? 254 : 253, isHigh ? 205 : 211, isHigh ? 211 : 153);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 2, 2, "FD");

    // Left accent bar
    doc.setFillColor(isHigh ? 239 : 217, isHigh ? 68 : 119, isHigh ? 68 : 6);
    doc.roundedRect(MARGIN, y, 4, boxH, 1, 1, "F");

    // Severity pill (auto-sized)
    drawPill(r.severity, W - MARGIN - 2, y + 3, {
      fill: severityFill,
      color: severityColor,
      alignRight: true,
      maxW: 22,
      padX: 3,
      h: 6,
      fontSize: 6.5,
    });

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...severityColor);
    rTitleLines.forEach((line, li) => doc.text(line, MARGIN + 8, y + 6 + li * 4.5));

    // Description
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(rLines, MARGIN + 8, y + 6 + rTitleLines.length * 4.5 + 4);

    y += boxH + 4;
  });

  addPageFooter(3);

  // ─── PAGE 4: STRATEGIC RECOMMENDATIONS ───────────────────────────────────────
  doc.addPage();
  y = 18;
  y = sectionHeader("STRATEGIC RECOMMENDATIONS BY PILLAR", y);

  const actionPillars = pillarScores.filter(p => p.score < 70);
  actionPillars.forEach((pillar) => {
    const [pr, pg, pb] = scoreColor(pillar.score);

    // Measure score badge
    const scoreText = `${pillar.score}%`;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    const scoreBadgeW = Math.min(doc.getTextWidth(scoreText) + 6, 28);

    // Title available width reserves space for score badge + padding
    const titleMaxW = CONTENT_W - 10 - scoreBadgeW - 4;

    // Truncate title to a single line; recommendation + impact wrap normally
    const titleText = fitText(pillar.title, titleMaxW);
    const recLines = doc.splitTextToSize(pillar.rec, CONTENT_W - 10) as string[];
    const impactLines = doc.splitTextToSize(pillar.impact, CONTENT_W - 10) as string[];

    const boxH = 12 + recLines.length * 4.5 + impactLines.length * 3.5 + 8;

    if (y + boxH > 272) { doc.addPage(); addPageFooter(doc.getNumberOfPages()); y = 18; }

    // Card body
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 2, 2, "FD");

    // Top accent stripe
    doc.setFillColor(pr, pg, pb);
    doc.rect(MARGIN, y, CONTENT_W, 1.5, "F");

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(titleText, MARGIN + 5, y + 9);

    // Score badge — right-aligned, auto-sized
    drawPill(scoreText, W - MARGIN - 3, y + 3.5, {
      fill: [pr, pg, pb],
      color: [255, 255, 255],
      alignRight: true,
      maxW: 24,
      padX: 3,
      h: 7,
      fontSize: 7.5,
    });

    // Recommendation (wraps as many lines as needed)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(recLines, MARGIN + 5, y + 16);

    // Impact italic at bottom
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    impactLines.forEach((line, li) =>
      doc.text(line, MARGIN + 5, y + 16 + recLines.length * 4.5 + 4 + li * 3.5),
    );

    y += boxH + 5;
  });

  if (actionPillars.length === 0) {
    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(153, 246, 228);
    doc.roundedRect(MARGIN, y, CONTENT_W, 20, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(6, 95, 70);
    doc.text("Strong performance across all dimensions — ready to scale AI adoption.", MARGIN + 5, y + 12);
    y += 26;
  }

  // ROI Scenarios — guarantee clean separation from the last recommendation
  // card. sectionHeader draws 6mm ABOVE y, so ensure at least 10mm clearance.
  // If the header + 3 ROI tiles (header 16mm + tiles 32mm + footer buffer
  // ~12mm = ~60mm total) don't fit on the current page, start a new one.
  y += 10;
  if (y + 60 > 275) {
    doc.addPage();
    addPageFooter(doc.getNumberOfPages());
    y = 18;
  }

  y = sectionHeader("ROI SCENARIOS", y);
  const roiScenarios = [
    { label: "Conservative", value: roi.scenarios.low, desc: "Baseline efficiency gains with minimal change management", color: [100, 116, 139] as [number,number,number] },
    { label: "Moderate", value: roi.scenarios.mid, desc: "Structured implementation with cross-functional adoption", color: [8, 145, 178] as [number,number,number] },
    { label: "Optimistic", value: roi.scenarios.high, desc: "Full capability build with strategic AI-first transformation", color: [13, 148, 136] as [number,number,number] },
  ];
  const roiW = (CONTENT_W - 8) / 3;
  roiScenarios.forEach((s, i) => {
    const rx = MARGIN + i * (roiW + 4);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(rx, y, roiW, 30, 2, 2, "FD");
    doc.setFillColor(...s.color);
    doc.rect(rx, y, roiW, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...s.color);
    doc.text(s.label.toUpperCase(), rx + roiW / 2, y + 8, { align: "center" });
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(s.value, rx + roiW / 2, y + 18, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    const descLines = doc.splitTextToSize(s.desc, roiW - 4);
    doc.text(descLines, rx + roiW / 2, y + 24, { align: "center" });
  });

  addPageFooter(4);

  // Free-tier exports carry a diagonal watermark on every page; Pro
  // subscribers get the clean report (the "cleanPdf" feature gate).
  if (options.watermark) {
    const pageCount = doc.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(46);
      doc.setTextColor(226, 232, 240);
      doc.text("FREE VERSION — UPGRADE FOR CLEAN EXPORT", 105, 160, {
        align: "center",
        angle: 38,
      });
    }
  }

  const safeName = `${assessment.businessName || "business"}-${assessment.name}`.replace(/[^a-z0-9]+/gi, "-");
  doc.save(`AI-Readiness-Report-${safeName}.pdf`);
}

export function mailTo(assessment: Assessment) {
  const overall = getWeightedOverallScore(assessment);
  const band = getBand(overall);
  const risk = getRiskScore(assessment);
  const impact = getBusinessImpact(assessment);
  const roi = getROIOpportunity(assessment);
  const sector = SECTORS.find((s) => s.value === assessment.sector);
  
  const body = encodeURIComponent([
    `AI Transformation Readiness Report`,
    ``,
    `Organisation: ${assessment.businessName || "N/A"}`,
    `Sector: ${sector?.label || "General"}`,
    `Assessment: ${assessment.name}`,
    `Assessor: ${assessment.assessor || "N/A"}`,
    ``,
    `Overall Score: ${overall}% — ${getExternalMaturityLabel(band.label)} (${band.label})`,
    `Risk Level: ${risk.level.charAt(0).toUpperCase() + risk.level.slice(1)}`,
    `Business Impact: ${impact.category}`,
    `ROI Opportunity: ${roi.range}`,
    ``,
    `Pillar Scores:`,
    ...PILLARS.map((p) => `- ${p.title}: ${getWeightedPillarScore(p, assessment.scores)}%`),
    ``,
    `Key Recommendations:`,
    ...PILLARS.filter((p) => getWeightedPillarScore(p, assessment.scores) < 50).map((p) => `- ${p.title}: ${p.strategicRecommendations[assessment.sector]}`),
    assessment.notes ? `` : ``,
    assessment.notes ? `Notes: ${assessment.notes}` : ``,
  ].filter(Boolean).join("\n"));
  
  window.location.href = `mailto:?subject=${encodeURIComponent(`AI Readiness Report - ${assessment.businessName || assessment.name}`)}&body=${body}`;
}
