"use client";

import { useScrollReveal } from "@/lib/gsap-hooks";
import { CtaButton } from "./cta-button";

const STATS = [
  { stat: "15%", title: "Infrastructure-ready", body: "Only a small minority of organisations have infrastructure ready for AI workloads.", source: "Cisco AI Readiness Index" },
  { stat: "76%", title: "Centralised data", body: "Top performers are far more likely to have fully centralised data foundations.", source: "Cisco AI Readiness Index" },
  { stat: "46%", title: "Skills gap", body: "Many leaders identify skills gaps as a major barrier to AI adoption.", source: "McKinsey workforce research" },
  { stat: "13%", title: "AI pacesetters", body: "Only a small group of organisations qualify as AI pacesetters.", source: "Cisco AI Readiness Index" },
];

export function AiGap() {
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.1 });

  return (
    <section
      id="readiness-gap"
      style={{
        position: "relative",
        padding: "120px 24px",
        background: "#050914",
        color: "#fff",
      }}
    >
      <div ref={sectionRef} style={{ maxWidth: 1240, margin: "0 auto" }}>

        {/* Header — two-column split */}
        <div className="gsap-reveal gap-header" style={{ display: "grid", gap: 64, alignItems: "start", marginBottom: 64 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--lavender-glow)", textTransform: "uppercase" as const, letterSpacing: "0.6px", display: "inline-block", marginBottom: 16 }}>
              The AI Readiness Gap
            </span>
            <h2 style={{ fontSize: "clamp(34px, 4.4vw, 56px)", fontWeight: 460, lineHeight: 0.98, letterSpacing: "-1.4px", color: "#fff", margin: 0 }}>
              Most organisations are experimenting.{" "}
              <em style={{ fontStyle: "italic" }}>Few are ready to scale.</em>
            </h2>
          </div>
          <div style={{ paddingTop: 4 }}>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
              The gap between AI pacesetters and everyone else is not ambition. It is the maturity of their data, infrastructure, governance, skills, and ability to turn pilots into measurable value.
            </p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="gsap-reveal gap-grid" style={{ display: "grid", gap: 24 }}>
          {STATS.map((item) => (
            <div
              key={item.stat}
              className="gap-card card-hover reveal"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16,
                padding: 32,
              }}
            >
              <p style={{ fontSize: "clamp(44px, 5.2vw, 60px)", fontWeight: 540, color: "var(--lavender-glow)", lineHeight: 1, marginBottom: 20, fontFamily: "var(--font-mono)" }}>
                {item.stat}
              </p>
              <h3 style={{ fontSize: 20, fontWeight: 540, color: "#fff", margin: "0 0 10px", letterSpacing: "-0.3px" }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 14.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.55, margin: "0 0 20px" }}>
                {item.body}
              </p>
              <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.5px", margin: 0 }}>
                {item.source}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom callout bar */}
        <div
          className="gsap-reveal gap-callout"
          style={{
            marginTop: 48,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: "32px 40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 32,
          }}
        >
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--lavender-glow)", textTransform: "uppercase" as const, letterSpacing: "0.6px", display: "inline-block", marginBottom: 12 }}>
              Why this matters
            </span>
            <h3 style={{ fontSize: "clamp(22px, 2.5vw, 28px)", fontWeight: 540, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.3px" }}>
              AI readiness is now a board-level operating risk.
            </h3>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.55, margin: 0, maxWidth: 640 }}>
              Without a measurable baseline, organisations risk funding isolated pilots, unmanaged shadow AI, weak governance, and unclear returns — making AI a liability, not a capability.
            </p>
          </div>
          <CtaButton style={{ flexShrink: 0 }}>Start Free Assessment</CtaButton>
        </div>
      </div>

      <style jsx global>{`
        .gap-header {
          grid-template-columns: 1fr;
        }
        .gap-grid {
          grid-template-columns: repeat(4, 1fr);
        }
        .gap-card:hover {
          border-color: var(--lavender-glow) !important;
        }
        @media (min-width: 1024px) {
          .gap-header {
            grid-template-columns: 3fr 2fr;
          }
        }
        @media (max-width: 980px) {
          .gap-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .gap-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 767px) {
          .gap-callout {
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 24px !important;
          }
        }
      `}</style>
    </section>
  );
}
