"use client";

import { Compass, Users, Workflow, Database, Cpu, Scale, Heart, Rocket, type LucideIcon } from "lucide-react";
import { useScrollReveal } from "@/lib/gsap-hooks";
import React, { useCallback } from "react";

const DIMENSIONS: { Icon: LucideIcon; num: string; title: string; description: string }[] = [
  { Icon: Compass, num: "01", title: "Strategy & Leadership", description: "How clearly AI is owned, governed, and tied to measurable value." },
  { Icon: Users, num: "02", title: "People & Capability", description: "Literacy, capability, and cultural openness to AI across the organisation." },
  { Icon: Workflow, num: "03", title: "Process & Operations", description: "AI embedded into real workflows, not just experimented with." },
  { Icon: Database, num: "04", title: "Data & Insight", description: "The quality, accessibility, and governance of your data foundations." },
  { Icon: Cpu, num: "05", title: "Technology & Integration", description: "Infrastructure readiness for AI workloads at scale." },
  { Icon: Scale, num: "06", title: "Ethics & Governance", description: "Guardrails, accountability, and responsible AI in practice." },
  { Icon: Heart, num: "07", title: "Culture & Change", description: "Change management, collaboration maturity, and digital mindset." },
  { Icon: Rocket, num: "08", title: "Innovation & Experimentation", description: "Pilot infrastructure, learning loops, and scaling pathways." },
];

export function DimensionsGrid() {
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.08 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, []);

  return (
    <section
      id="framework"
      style={{
        position: "relative",
        padding: "120px 24px",
        background: "var(--bg-page-2, #f2ede4)",
      }}
    >
      {/* Ambient grid */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: "linear-gradient(to right, rgba(41,40,39,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(41,40,39,0.055) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, #000 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, #000 0%, transparent 75%)",
        }}
      />

      <div ref={sectionRef} style={{ maxWidth: 1240, margin: "0 auto", position: "relative" }}>
        <div className="gsap-reveal" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 40, flexWrap: "wrap" }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--amethyst-link)", textTransform: "uppercase" as const, letterSpacing: "0.6px", display: "inline-block", marginBottom: 16 }}>
              The 8 dimensions
            </span>
            <h2 style={{ fontSize: "clamp(34px, 4.4vw, 56px)", fontWeight: 460, lineHeight: 0.98, letterSpacing: "-1.4px", maxWidth: 820, color: "var(--fg-1)", margin: 0 }}>
              We measure readiness across<br />eight operational axes — not vibes.
            </h2>
          </div>
          <p style={{ fontSize: 17, color: "var(--fg-2)", maxWidth: 420, lineHeight: 1.55, marginTop: 24 }}>
            Every engagement begins with a score on all eight. You see the gaps before you invest.
          </p>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 56 }}
          className="frame-steps-grid"
        >
          {DIMENSIONS.map((d) => (
            <div
              key={d.title}
              className="gsap-reveal"
              onMouseMove={handleMouseMove}
              style={{
                position: "relative",
                borderRadius: 16,
                padding: "28px 24px",
                background: "var(--pure-white)",
                border: "1px solid var(--parchment-border)",
                overflow: "hidden",
                transition: "transform 260ms cubic-bezier(0.22, 0.61, 0.36, 1), border-color 260ms ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(203,183,251,0.6)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--parchment-border)";
              }}
            >
              {/* Mouse-tracked radial glow */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(420px 180px at var(--mx, 50%) var(--my, 0%), rgba(203,183,251,0.22), transparent 70%)",
                  opacity: 0,
                  transition: "opacity 260ms ease",
                  pointerEvents: "none",
                }}
                className="hover-glow"
              />
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--amethyst-link)", letterSpacing: "0.6px", textTransform: "uppercase" as const }}>
                {d.num}
              </div>
              <h4 style={{ fontSize: 20, fontWeight: 540, color: "var(--fg-1)", margin: "10px 0 8px", letterSpacing: "-0.3px" }}>
                {d.title}
              </h4>
              <p style={{ fontSize: 14.5, color: "var(--fg-2)", lineHeight: 1.55, margin: 0 }}>
                {d.description}
              </p>
              <div style={{ width: 40, height: 40, marginTop: 16, color: "var(--fg-3)" }}>
                <d.Icon size={28} strokeWidth={1.5} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .frame-steps-grid > div:hover .hover-glow { opacity: 1 !important; }
        @media (max-width: 980px) { .frame-steps-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 560px) { .frame-steps-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
