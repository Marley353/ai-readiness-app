"use client";

import Link from "next/link";
import { BarChart3, TrendingUp, FileText } from "lucide-react";
import { useScrollReveal } from "@/lib/gsap-hooks";

const SLABS = [
  {
    num: "ONE",
    Icon: BarChart3,
    title: "The Readiness Scorecard.",
    body: "Thirty-two calibrated questions across eight dimensions. No sign-up wall, no sales-first gate. You walk away with a number on the board and a side-by-side benchmark against your sector.",
    bullets: ["Sector-specific benchmark on every pillar", "Instant radar chart + bar chart visualisation", "Scored against Cisco Index data from 8,000+ organisations"],
    cta: "Score your team →",
    href: "/app",
  },
  {
    num: "TWO",
    Icon: TrendingUp,
    title: "The 12-Month Roadmap.",
    body: "A phased plan auto-generated from your scores. Foundation (0-90 days), Build (3-6 months), Scale (6-12 months) — every action mapped to your weakest dimensions.",
    bullets: ["Phase-by-phase action items with priority tags", "Tailored to your lowest-scoring dimensions first", "Timeline format ready to drop into a board pack"],
    cta: "Preview the roadmap →",
    href: "/pricing",
  },
  {
    num: "THREE",
    Icon: FileText,
    title: "Board-ready PDF export.",
    body: "Professional 4-page report with your organisation name, sector profile, scorecard, benchmarks, opportunities and risks, and strategic recommendations. Designed for executive circulation.",
    bullets: ["Confidential cover page with your branding area", "Executive summary, pillar scores and ROI scenarios", "Auto-paginated — no manual formatting needed"],
    cta: "Try the export →",
    href: "/app",
  },
];

export function FeatureSlabs() {
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.12 });

  return (
    <section
      style={{
        position: "relative",
        padding: "120px 24px",
        background: "var(--bg-page-2, #f2ede4)",
      }}
    >
      <div ref={sectionRef} style={{ maxWidth: 1240, margin: "0 auto", position: "relative" }}>
        <div className="gsap-reveal" style={{ maxWidth: 720, marginBottom: 56 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--amethyst-link)", textTransform: "uppercase" as const, letterSpacing: "0.6px", display: "inline-block", marginBottom: 16 }}>
            What you get
          </span>
          <h2 style={{ fontSize: "clamp(34px, 4.4vw, 56px)", fontWeight: 460, lineHeight: 0.98, letterSpacing: "-1.4px", color: "var(--fg-1)", margin: 0 }}>
            A high-fidelity <em style={{ fontStyle: "italic" }}>mechanism</em>,<br />not another deck.
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {SLABS.map((slab, i) => (
            <div
              key={slab.num}
              className="gsap-reveal"
              style={{
                display: "grid",
                gridTemplateColumns: i % 2 === 1 ? "1fr 1fr" : "1fr 1fr",
                gap: 48,
                background: "var(--pure-white)",
                border: "1px solid var(--parchment-border)",
                borderRadius: 16,
                padding: 48,
                alignItems: "center",
              }}
            >
              {/* Text */}
              <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 460, order: i % 2 === 1 ? 2 : 1 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--amethyst-link)", letterSpacing: "1px" }}>{slab.num}</span>
                <h3 style={{ fontSize: 40, fontWeight: 540, lineHeight: 1, letterSpacing: "-1px", color: "var(--fg-1)", margin: 0 }}>{slab.title}</h3>
                <p style={{ fontSize: 17, fontWeight: 460, lineHeight: 1.55, color: "var(--fg-2)", margin: 0 }}>{slab.body}</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {slab.bullets.map((b) => (
                    <li key={b} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14.5, color: "var(--fg-2)" }}>
                      <span style={{ color: "var(--amethyst-link)", marginTop: 1 }}>—</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={slab.href}
                  style={{ fontSize: 15, fontWeight: 540, color: "var(--amethyst-link)", textDecoration: "underline", textUnderlineOffset: "3px" }}
                >
                  {slab.cta}
                </Link>
              </div>

              {/* Visual */}
              <div
                style={{
                  minHeight: 320,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  order: i % 2 === 1 ? 1 : 2,
                  borderRadius: 16,
                  background: "linear-gradient(160deg, #14131f, #0b0a14)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "var(--lavender-glow)", filter: "blur(80px)", opacity: 0.3, top: -40, right: -40 }} />
                <div style={{ position: "relative", width: 80, height: 80, borderRadius: 16, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 48px rgba(255,183,112,0.25)" }}>
                  <slab.Icon size={36} strokeWidth={1.5} color="#fff" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
