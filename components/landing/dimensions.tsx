"use client";

import { useScrollReveal } from "@/lib/gsap-hooks";

const DIMENSIONS = [
  { num: "01", title: "Leadership & Strategy", desc: "Clarity of AI vision and executive ownership" },
  { num: "02", title: "Data Foundations", desc: "Quality, accessibility, and governance of your data" },
  { num: "03", title: "Technology & Architecture", desc: "Infrastructure readiness for AI workloads" },
  { num: "04", title: "People & Culture", desc: "Skills, mindset, and organisational readiness" },
  { num: "05", title: "Process Integration", desc: "AI embedded into real workflows" },
  { num: "06", title: "Governance & Risk", desc: "Controls, ethics, and compliance structures" },
  { num: "07", title: "Training & Enablement", desc: "Capability building and adoption" },
  { num: "08", title: "Value Realisation", desc: "Measurement and ROI from AI initiatives" },
];

export function DimensionsGrid() {
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.1 });

  return (
    <section
      id="framework"
      style={{
        position: "relative",
        padding: "120px 24px",
        background: "#080D1A",
        color: "#fff",
      }}
    >
      <div ref={sectionRef} style={{ maxWidth: 1240, margin: "0 auto" }}>

        {/* Header */}
        <div className="gsap-reveal" style={{ textAlign: "center", marginBottom: 64 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--lavender-glow)", textTransform: "uppercase" as const, letterSpacing: "0.6px", display: "inline-block", marginBottom: 16 }}>
            The 8 Dimensions
          </span>
          <h2 style={{ fontSize: "clamp(34px, 4.4vw, 56px)", fontWeight: 460, lineHeight: 0.98, letterSpacing: "-1.4px", color: "#fff", margin: "0 auto", maxWidth: 820 }}>
            AI readiness isn't a feeling —{" "}
            <em style={{ fontStyle: "italic" }}>it's measurable</em>
          </h2>
          <p style={{ fontSize: 19, fontWeight: 460, lineHeight: 1.55, color: "rgba(255,255,255,0.75)", maxWidth: 680, margin: "20px auto 0" }}>
            We assess your organisation across eight operational dimensions that determine whether AI delivers real value — or fails to scale.
          </p>
        </div>

        {/* Cards grid */}
        <div className="gsap-reveal dim-grid" style={{ display: "grid", gap: 20 }}>
          {DIMENSIONS.map(({ num, title, desc }) => (
            <div
              key={num}
              className="dim-card"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 16,
                padding: 24,
                transition: "transform 260ms ease, border-color 260ms ease",
                cursor: "default",
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--lavender-glow)", letterSpacing: "0.6px", marginBottom: 8 }}>
                {num}
              </p>
              <h3 style={{ fontSize: 20, fontWeight: 540, color: "#fff", margin: "0 0 10px", letterSpacing: "-0.3px" }}>
                {title}
              </h3>
              <p style={{ fontSize: 14.5, color: "rgba(255,255,255,0.75)", lineHeight: 1.55, margin: "0 0 16px" }}>
                {desc}
              </p>
              <div className="dim-bar" style={{ height: 3, width: 40, background: "var(--lavender-glow)", borderRadius: 2, transition: "width 300ms ease" }} />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="gsap-reveal" style={{ textAlign: "center", marginTop: 64 }}>
          <button
            onClick={() => document.getElementById("assessment")?.scrollIntoView({ behavior: "smooth" })}
            className="hover:scale-105 transition-all duration-200"
            style={{
              padding: "14px 28px",
              background: "var(--lavender-glow)",
              color: "#080D1A",
              fontWeight: 600,
              fontSize: 15,
              borderRadius: "var(--r-sm)",
              border: "none",
              cursor: "pointer",
            }}
          >
            Start Free Assessment
          </button>
        </div>
      </div>

      <style jsx global>{`
        .dim-grid {
          grid-template-columns: repeat(4, 1fr);
        }
        .dim-card:hover {
          transform: scale(1.04);
          border-color: var(--lavender-glow) !important;
        }
        .dim-card:hover .dim-bar {
          width: 100% !important;
        }
        @media (max-width: 980px) {
          .dim-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .dim-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
