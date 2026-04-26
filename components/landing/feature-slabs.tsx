"use client";

import Link from "next/link";
import { BarChart3, TrendingUp, FileText } from "lucide-react";
import { useScrollReveal } from "@/lib/gsap-hooks";
import React from "react";

// ── Product illustration mockups ──────────────────────────────────

function ScorecardMock() {
  const dims = [
    { label: "Strategy", v: 82 },
    { label: "People", v: 64 },
    { label: "Process", v: 71 },
    { label: "Data", v: 58 },
    { label: "Technology", v: 75 },
    { label: "Ethics", v: 48 },
    { label: "Culture", v: 67 },
    { label: "Innovation", v: 53 },
  ];
  return (
    <div style={{ width: "100%", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, fontSize: 11, fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.5)" }}>
        <span>Readiness scorecard</span>
        <span style={{ color: "var(--lavender-glow)", fontFamily: "var(--font-mono)" }}>73 / 100</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {dims.map((d, i) => (
          <div key={d.label}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.75)", marginBottom: 3 }}>
              <span>{d.label}</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.5)", fontSize: 10 }}>{d.v}</span>
            </div>
            <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2, width: `${d.v}%`,
                background: "linear-gradient(90deg, var(--lavender-glow), #fff)",
                transformOrigin: "left",
                animation: `fillBar 1.4s ${0.3 + i * 0.1}s cubic-bezier(0.22,0.61,0.36,1) both`,
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoadmapMock() {
  const phases = [
    { label: "FOUNDATION", range: "0–90 DAYS", items: ["Map governance gaps", "Nominate AI sponsor", "Baseline data audit"], color: "var(--lavender-glow)" },
    { label: "BUILD", range: "3–6 MONTHS", items: ["Run first pilot", "Embed eval harness", "Cross-team training"], color: "rgba(255,255,255,0.6)" },
    { label: "SCALE", range: "6–12 MONTHS", items: ["Production rollout", "Quarterly reassess", "Enterprise governance"], color: "rgba(255,255,255,0.4)" },
  ];
  return (
    <div style={{ width: "100%", padding: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>
        12-month roadmap
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {phases.map((p, pi) => (
          <div key={p.label} style={{
            padding: 14, borderRadius: 10,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            animation: `rise 500ms ${pi * 0.12}s both`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", color: p.color }}>{p.label}</span>
              <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.4)" }}>{p.range}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {p.items.map((item) => (
                <div key={item} style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PdfMock() {
  return (
    <div style={{ width: "100%", padding: 24, display: "flex", justifyContent: "center", alignItems: "center" }}>
      {/* Tilted document mock */}
      <div style={{
        width: 220, minHeight: 280,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 8,
        padding: 20,
        transform: "perspective(600px) rotateY(-6deg) rotateX(2deg)",
        boxShadow: "20px 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset",
      }}>
        {/* Cover header bar */}
        <div style={{ height: 4, borderRadius: 2, background: "linear-gradient(90deg, var(--lavender-glow), transparent)", marginBottom: 16 }} />
        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.4px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" as const, marginBottom: 4 }}>
          AI Readiness Report
        </div>
        <div style={{ fontSize: 14, fontWeight: 540, color: "#fff", lineHeight: 1.2, marginBottom: 12 }}>
          AI Transformation<br />Readiness Report
        </div>
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 12 }} />
        {/* Meta rows */}
        {["Organisation", "Sector", "Assessor", "Date"].map((label) => (
          <div key={label} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 7, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.3px", textTransform: "uppercase" as const }}>{label}</div>
            <div style={{ height: 6, width: `${50 + Math.random() * 40}%`, borderRadius: 2, background: "rgba(255,255,255,0.08)", marginTop: 3 }} />
          </div>
        ))}
        {/* Score circle */}
        <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            border: "2px solid var(--lavender-glow)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 540, color: "#fff",
          }}>
            73
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: 7, color: "rgba(255,255,255,0.4)", marginTop: 6, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.3px" }}>
          Readiness Score
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

const SLABS = [
  {
    num: "ONE",
    Icon: BarChart3,
    title: "The Readiness Scorecard.",
    body: "Thirty-two calibrated questions across eight dimensions. No sign-up wall, no sales-first gate. You walk away with a number on the board and a side-by-side benchmark against your sector.",
    bullets: ["Sector-specific benchmark on every pillar", "Instant radar chart + bar chart visualisation", "Scored against Cisco Index data from 8,000+ organisations"],
    cta: "Start Free Assessment →",
    href: "/app",
    Visual: ScorecardMock,
  },
  {
    num: "TWO",
    Icon: TrendingUp,
    title: "The 12-Month Roadmap.",
    body: "A phased plan auto-generated from your scores. Foundation (0-90 days), Build (3-6 months), Scale (6-12 months) — every action mapped to your weakest dimensions.",
    bullets: ["Phase-by-phase action items with priority tags", "Tailored to your lowest-scoring dimensions first", "Timeline format ready to drop into a board pack"],
    cta: "Start Free Assessment →",
    href: "/app",
    Visual: RoadmapMock,
  },
  {
    num: "THREE",
    Icon: FileText,
    title: "Board-ready PDF export.",
    body: "Professional 4-page report with your organisation name, sector profile, scorecard, benchmarks, opportunities and risks, and strategic recommendations. Designed for executive circulation.",
    bullets: ["Confidential cover page with your branding area", "Executive summary, pillar scores and ROI scenarios", "Auto-paginated — no manual formatting needed"],
    cta: "Start Free Assessment →",
    href: "/app",
    Visual: PdfMock,
  },
];

export function FeatureSlabs() {
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.12 });

  return (
    <section
      style={{
        position: "relative",
        padding: "120px 24px",
        background: "#050914",
        color: "#fff",
      }}
    >
      <div ref={sectionRef} style={{ maxWidth: 1240, margin: "0 auto", position: "relative" }}>
        <div className="gsap-reveal" style={{ maxWidth: 720, marginBottom: 56 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--lavender-glow)", textTransform: "uppercase" as const, letterSpacing: "0.6px", display: "inline-block", marginBottom: 16 }}>
            What you get
          </span>
          <h2 style={{ fontSize: "clamp(34px, 4.4vw, 56px)", fontWeight: 460, lineHeight: 0.98, letterSpacing: "-1.4px", color: "#fff", margin: 0 }}>
            A high-fidelity <em style={{ fontStyle: "italic" }}>mechanism</em>,<br />not another deck.
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {SLABS.map((slab, i) => (
            <div
              key={slab.num}
              className="gsap-reveal slab-grid shadow-lg hover:shadow-2xl transition duration-300"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 0,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16,
                overflow: "hidden",
                alignItems: "stretch",
              }}
            >
              {/* Text */}
              <div style={{ padding: 48, display: "flex", flexDirection: "column", gap: 18, justifyContent: "center", order: i % 2 === 1 ? 2 : 1 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--lavender-glow)", letterSpacing: "1px" }}>{slab.num}</span>
                <h3 style={{ fontSize: 40, fontWeight: 540, lineHeight: 1, letterSpacing: "-1px", color: "#fff", margin: 0 }}>{slab.title}</h3>
                <p style={{ fontSize: 17, fontWeight: 460, lineHeight: 1.55, color: "rgba(255,255,255,0.65)", margin: 0 }}>{slab.body}</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {slab.bullets.map((b) => (
                    <li key={b} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14.5, color: "rgba(255,255,255,0.7)" }}>
                      <span style={{ color: "var(--lavender-glow)", marginTop: 1 }}>—</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={slab.href}
                  style={{ fontSize: 15, fontWeight: 540, color: "var(--lavender-glow)", textDecoration: "underline", textUnderlineOffset: "3px" }}
                >
                  {slab.cta}
                </Link>
              </div>

              {/* Visual — product mockup instead of generic icon */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  order: i % 2 === 1 ? 1 : 2,
                  background: "linear-gradient(160deg, #14131f, #0b0a14)",
                  position: "relative",
                  overflow: "hidden",
                  minHeight: 380,
                }}
              >
                {/* Grid bg inside dark panel */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                    maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, #000, transparent 75%)",
                    WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, #000, transparent 75%)",
                  }}
                />
                <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "var(--lavender-glow)", filter: "blur(80px)", opacity: 0.25, top: -40, right: -40 }} />
                <div style={{ position: "absolute", width: 140, height: 140, borderRadius: "50%", background: "var(--amethyst-link)", filter: "blur(70px)", opacity: 0.2, bottom: -20, left: -30 }} />
                <div style={{ position: "relative", width: "100%", maxWidth: 360 }}>
                  <slab.Visual />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes rise {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 980px) {
          .slab-grid { grid-template-columns: 1fr !important; }
          .slab-grid > div { order: unset !important; }
        }
      `}</style>
    </section>
  );
}
