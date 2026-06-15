"use client";

import { useScrollReveal } from "@/lib/gsap-hooks";
import { CtaButton } from "./cta-button";

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
        background: "var(--bg-page-2, #f2ede4)",
      }}
    >
      <div ref={sectionRef} style={{ maxWidth: 1240, margin: "0 auto" }}>

        {/* Header */}
        <div className="gsap-reveal" style={{ textAlign: "center", marginBottom: 64 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--amethyst-link)", textTransform: "uppercase" as const, letterSpacing: "0.6px", display: "inline-block", marginBottom: 16 }}>
            The 8 Dimensions
          </span>
          <h2 style={{ fontSize: "clamp(34px, 4.4vw, 56px)", fontWeight: 460, lineHeight: 0.98, letterSpacing: "-1.4px", color: "var(--fg-1)", margin: "0 auto", maxWidth: 820 }}>
            AI readiness isn't a feeling —{" "}
            <em style={{ fontStyle: "italic" }}>it's measurable</em>
          </h2>
          <p style={{ fontSize: 19, fontWeight: 460, lineHeight: 1.55, color: "var(--fg-2)", maxWidth: 680, margin: "20px auto 0" }}>
            We assess your organisation across eight operational dimensions that determine whether AI delivers real value — or fails to scale.
          </p>
        </div>

        {/* Cards grid */}
        <div className="gsap-reveal dim-grid" style={{ display: "grid", gap: 20 }}>
          {DIMENSIONS.map(({ num, title, desc }) => (
            <div
              key={num}
              className="dim-card card-hover reveal"
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
                e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
              }}
              style={{
                position: "relative",
                background: "var(--pure-white)",
                border: "1px solid var(--parchment-border)",
                borderRadius: 16,
                padding: 24,
                cursor: "default",
                overflow: "hidden",
              }}
            >
              {/* cursor spotlight */}
              <span className="dim-spotlight" aria-hidden />
              <p style={{ position: "relative", fontSize: 11, fontWeight: 700, color: "var(--amethyst-link)", letterSpacing: "0.6px", marginBottom: 8 }}>
                {num}
              </p>
              <h3 style={{ position: "relative", fontSize: 20, fontWeight: 540, color: "var(--fg-1)", margin: "0 0 10px", letterSpacing: "-0.3px" }}>
                {title}
              </h3>
              <p style={{ position: "relative", fontSize: 14.5, color: "var(--fg-2)", lineHeight: 1.55, margin: "0 0 16px" }}>
                {desc}
              </p>
              <div className="dim-bar" style={{ position: "relative", height: 3, width: 40, background: "var(--amethyst-link)", borderRadius: 2, transition: "width 300ms ease" }} />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="gsap-reveal" style={{ textAlign: "center", marginTop: 64 }}>
          <CtaButton>Start Free Assessment</CtaButton>
        </div>
      </div>

      <style jsx global>{`
        .dim-grid {
          grid-template-columns: repeat(4, 1fr);
        }
        .dim-card {
          transition: transform 300ms cubic-bezier(.22,1,.36,1), border-color 300ms ease, box-shadow 300ms ease;
        }
        .dim-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255,165,82,0.6) !important;
          box-shadow: 0 20px 50px rgba(255,138,61,0.1);
        }
        .dim-card:hover .dim-bar {
          width: 100% !important;
        }
        .dim-spotlight {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          transition: opacity 300ms ease;
          background: radial-gradient(220px circle at var(--mx, 50%) var(--my, 50%), rgba(255,165,82,0.16), transparent 60%);
        }
        .dim-card:hover .dim-spotlight { opacity: 1; }
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
