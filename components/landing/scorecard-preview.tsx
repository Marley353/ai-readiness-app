"use client";

const DIMENSIONS = [
  { label: "Leadership & Strategy", score: 74, colour: "#00C9A7" },
  { label: "Data Foundations", score: 58, colour: "#5B8DEF" },
  { label: "Technology & Architecture", score: 65, colour: "#9B72FF" },
  { label: "People, Skills & Culture", score: 61, colour: "#FF7BAC" },
  { label: "Process & Use-Case Integration", score: 55, colour: "#F5A623" },
  { label: "Governance, Risk & Ethics", score: 38, colour: "#FF6B35" },
  { label: "Training & Change Enablement", score: 44, colour: "#41D9B4" },
  { label: "Measurement & Value Realisation", score: 51, colour: "#FFD166" },
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

export function ScorecardPreview() {
  return (
    <section id="scorecard-preview" className="relative text-white" style={{ background: "#080D1A", padding: "96px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p className="text-sm uppercase tracking-widest" style={{ color: "#00C9A7", marginBottom: 16 }}>
            Your AI Readiness Scorecard
          </p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700, lineHeight: 1.1, marginBottom: 24, color: "#fff" }}>
            See where your organisation is ready — and where it is exposed
          </h2>
          <p style={{ fontSize: 18, color: "#94a3b8", maxWidth: 768, margin: "0 auto", lineHeight: 1.6 }}>
            Your results are translated into a clear readiness score, benchmark comparison, and priority action areas across 8 dimensions.
          </p>
        </div>

        {/* Score + Dimensions grid */}
        <div className="scorecard-grid" style={{ display: "grid", gap: 24, alignItems: "stretch" }}>

          {/* Overall Score Card */}
          <div className="scorecard-score" style={{ background: "#0F1629", border: "1px solid #1E2D4A", borderRadius: 24, padding: 32 }}>
            <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 8 }}>Overall readiness score</p>

            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 24 }}>
              <span style={{ fontSize: 60, fontWeight: 700, color: "#00C9A7", lineHeight: 1 }}>62</span>
              <span style={{ fontSize: 20, color: "#94a3b8", marginBottom: 6 }}>/100</span>
            </div>

            <div style={{ width: "100%", height: 12, background: "#1E2D4A", borderRadius: 999, overflow: "hidden", marginBottom: 24 }}>
              <div style={{ height: "100%", width: "62%", background: "#00C9A7", borderRadius: 999 }} />
            </div>

            <div style={{ background: "#162038", borderRadius: 16, padding: 20, border: "1px solid #1E2D4A" }}>
              <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 4 }}>Indicative tier</p>
              <p style={{ fontSize: 24, fontWeight: 600, color: "#fff", margin: 0 }}>Chaser</p>
              <p style={{ fontSize: 14, color: "#cbd5e1", marginTop: 8, lineHeight: 1.5 }}>
                Active experimentation, but not yet consistently scaled or governed.
              </p>
            </div>
          </div>

          {/* Dimension Breakdown */}
          <div className="scorecard-dims" style={{ background: "#0F1629", border: "1px solid #1E2D4A", borderRadius: 24, padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
              <div>
                <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 4 }}>8-dimension breakdown</p>
                <h3 style={{ fontSize: 24, fontWeight: 600, color: "#fff", margin: 0 }}>Readiness profile</h3>
              </div>
              <span style={{ fontSize: 13, color: "#00C9A7" }}>Sample output</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {DIMENSIONS.map(({ label, score, colour }) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                    <span style={{ color: "#cbd5e1" }}>{label}</span>
                    <span style={{ fontFamily: "monospace", color: "#94a3b8" }}>{score}/100</span>
                  </div>
                  <div style={{ height: 8, background: "#1E2D4A", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${score}%`, backgroundColor: colour, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insight Cards */}
        <div className="insight-grid" style={{ display: "grid", gap: 24, marginTop: 24 }}>
          {INSIGHTS.map((card) => (
            <div key={card.tag} style={{ background: "#0F1629", border: "1px solid #1E2D4A", borderRadius: 24, padding: 24 }}>
              <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 8 }}>{card.tag}</p>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: "#fff", margin: "0 0 8px" }}>{card.title}</h3>
              <p style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.55, margin: 0 }}>{card.body}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <button
            onClick={() => document.getElementById("assessment")?.scrollIntoView({ behavior: "smooth" })}
            className="hover:scale-105 transition-all duration-200"
            style={{
              padding: "16px 32px",
              background: "#00C9A7",
              color: "#080D1A",
              fontWeight: 600,
              fontSize: 15,
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
            }}
          >
            Get Your Readiness Score
          </button>
          <p style={{ fontSize: 14, color: "#94a3b8", marginTop: 16 }}>
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
