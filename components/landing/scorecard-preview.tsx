"use client";

import { useScrollReveal } from "@/lib/gsap-hooks";

const DIMENSIONS = [
  { label: "Leadership & Strategy", score: 74 },
  { label: "Data Foundations", score: 58 },
  { label: "Technology & Architecture", score: 65 },
  { label: "People, Skills & Culture", score: 61 },
  { label: "Process & Use-Case Integration", score: 55 },
  { label: "Governance, Risk & Ethics", score: 38 },
  { label: "Training & Change Enablement", score: 44 },
  { label: "Measurement & Value Realisation", score: 51 },
];

const INSIGHTS = [
  {
    tag: "Top strength",
    title: "Leadership & Strategy",
    body: "Your AI activity appears strategically aligned, with visible direction and ownership.",
  },
  {
    tag: "Highest risk gap",
    title: "Governance, Risk & Ethics",
    body: "Guardrails, oversight, and responsible AI controls may need attention before scaling.",
  },
  {
    tag: "Benchmark context",
    title: "Most organisations are still early",
    body: "Cisco research indicates only a minority of organisations qualify as AI pacesetters.",
  },
];

function barColour(score: number): string {
  if (score >= 70) return "var(--lavender-glow)";
  if (score >= 55) return "#c4a06a";
  return "var(--amethyst-link)";
}

export function ScorecardPreview() {
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.12 });

  return (
    <section
      id="scorecard-preview"
      style={{
        position: "relative",
        padding: "120px 24px",
        background: "var(--bg-page-2, #f2ede4)",
      }}
    >
      <div ref={sectionRef} style={{ maxWidth: 1240, margin: "0 auto" }}>

        {/* Header */}
        <div className="gsap-reveal" style={{ maxWidth: 720, marginBottom: 56 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--amethyst-link)", textTransform: "uppercase" as const, letterSpacing: "0.6px", display: "inline-block", marginBottom: 16 }}>
            Your AI Readiness Scorecard
          </span>
          <h2 style={{ fontSize: "clamp(34px, 4.4vw, 56px)", fontWeight: 460, lineHeight: 0.98, letterSpacing: "-1.4px", color: "var(--fg-1)", margin: 0 }}>
            See where your organisation is <em style={{ fontStyle: "italic" }}>ready</em> — and where it is exposed
          </h2>
          <p style={{ fontSize: 19, fontWeight: 460, lineHeight: 1.55, color: "var(--fg-2)", marginTop: 20 }}>
            Your results are translated into a clear readiness score, benchmark comparison, and priority action areas across 8 dimensions.
          </p>
        </div>

        {/* Score + Dimensions grid */}
        <div className="gsap-reveal scorecard-grid" style={{ display: "grid", gap: 24, alignItems: "stretch" }}>

          {/* Overall Score Card */}
          <div className="scorecard-score" style={{ background: "var(--pure-white)", border: "1px solid var(--parchment-border)", borderRadius: 16, padding: 32, transition: "transform 260ms ease, border-color 260ms ease" }}>
            <p style={{ fontSize: 14, color: "var(--fg-3)", marginBottom: 8 }}>Overall readiness score</p>

            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 24 }}>
              <span style={{ fontSize: "clamp(44px, 5.2vw, 64px)", fontWeight: 540, color: "var(--lavender-glow)", lineHeight: 1, fontFamily: "var(--font-mono)" }}>62</span>
              <span style={{ fontSize: 20, color: "var(--fg-3)", marginBottom: 6 }}>/100</span>
            </div>

            <div style={{ width: "100%", height: 8, background: "var(--parchment-border)", borderRadius: 999, overflow: "hidden", marginBottom: 24 }}>
              <div style={{ height: "100%", width: "62%", background: "var(--lavender-glow)", borderRadius: 999 }} />
            </div>

            <div style={{ background: "rgba(255,183,112,0.08)", borderRadius: 16, padding: 20, border: "1px solid rgba(255,183,112,0.25)" }}>
              <p style={{ fontSize: 14, color: "var(--fg-3)", marginBottom: 4 }}>Indicative tier</p>
              <p style={{ fontSize: 22, fontWeight: 540, color: "var(--fg-1)", margin: 0 }}>Chaser</p>
              <p style={{ fontSize: 14, color: "var(--fg-2)", marginTop: 8, lineHeight: 1.55 }}>
                Active experimentation, but not yet consistently scaled or governed.
              </p>
            </div>
          </div>

          {/* Dimension Breakdown */}
          <div className="scorecard-dims" style={{ background: "var(--pure-white)", border: "1px solid var(--parchment-border)", borderRadius: 16, padding: 32, transition: "transform 260ms ease, border-color 260ms ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
              <div>
                <p style={{ fontSize: 14, color: "var(--fg-3)", marginBottom: 4 }}>8-dimension breakdown</p>
                <h3 style={{ fontSize: 22, fontWeight: 540, color: "var(--fg-1)", margin: 0, letterSpacing: "-0.3px" }}>Readiness profile</h3>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--amethyst-link)", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Sample output</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {DIMENSIONS.map(({ label, score }) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
                    <span style={{ color: "var(--fg-2)" }}>{label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg-3)", fontSize: 13 }}>{score}/100</span>
                  </div>
                  <div style={{ height: 6, background: "var(--parchment-border)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${score}%`, background: barColour(score), borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insight Cards */}
        <div className="gsap-reveal insight-grid" style={{ display: "grid", gap: 24, marginTop: 24 }}>
          {INSIGHTS.map((card) => (
            <div
              key={card.tag}
              style={{
                background: "var(--pure-white)",
                border: "1px solid var(--parchment-border)",
                borderRadius: 16,
                padding: 28,
                transition: "transform 260ms ease, border-color 260ms ease",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--amethyst-link)", textTransform: "uppercase" as const, letterSpacing: "1px" }}>{card.tag}</span>
              <h3 style={{ fontSize: 20, fontWeight: 540, color: "var(--fg-1)", margin: "10px 0 8px", letterSpacing: "-0.3px" }}>{card.title}</h3>
              <p style={{ fontSize: 14.5, color: "var(--fg-2)", lineHeight: 1.55, margin: 0 }}>{card.body}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="gsap-reveal" style={{ textAlign: "center", marginTop: 48 }}>
          <button
            onClick={() => window.location.href = "/app"}
            className="hover:scale-105 transition-all duration-200 cta-glow"
            style={{
              padding: "14px 28px",
              background: "var(--charcoal-ink)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 15,
              borderRadius: "var(--r-sm)",
              border: "none",
              cursor: "pointer",
            }}
          >
            Start Free Assessment
          </button>
          <p style={{ fontSize: 14, color: "var(--fg-3)", marginTop: 16 }}>
            Complete the assessment to generate your own scorecard and priority actions.
          </p>
        </div>
      </div>

      <style jsx>{`
        .scorecard-grid {
          grid-template-columns: 1fr;
        }
        .insight-grid {
          grid-template-columns: 1fr;
        }
        .scorecard-score:hover,
        .scorecard-dims:hover {
          transform: translateY(-2px);
          border-color: var(--border-2);
        }
        @media (min-width: 1024px) {
          .scorecard-grid {
            grid-template-columns: 1fr 2fr;
          }
          .insight-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .insight-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </section>
  );
}
