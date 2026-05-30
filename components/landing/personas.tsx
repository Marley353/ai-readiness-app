"use client";

import { Briefcase, LayoutGrid, Building2 } from "lucide-react";
import { useScrollReveal } from "@/lib/gsap-hooks";

const PERSONAS = [
  { Icon: Briefcase, tag: "CONSULTANTS", title: "Deliver faster, defensible readiness reports.", description: "Ship boardroom-ready assessments to clients in hours, not weeks. The 8-dimension framework gives you a consistent, credible baseline across every engagement." },
  { Icon: LayoutGrid, tag: "TRANSFORMATION LEADS", title: "See the full map before you commit investment.", description: "Stop making AI roadmap decisions in the dark. Benchmark against your sector, identify genuine priority gaps and build a 12-month plan the exec team will actually back." },
  { Icon: Building2, tag: "BOARDS & EXECS", title: "A single score the whole C-suite can rally behind.", description: "Cut through the AI noise with a weighted, sector-aware maturity score. Get the strategic narrative your chair needs and the risk view your CFO will trust." },
];

export function Personas() {
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.1 });

  return (
    <section style={{ position: "relative", padding: "120px 24px" }}>
      <div ref={sectionRef} style={{ maxWidth: 1240, margin: "0 auto", position: "relative" }}>
        <div className="gsap-reveal" style={{ maxWidth: 760 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--amethyst-link)", textTransform: "uppercase" as const, letterSpacing: "0.6px", display: "inline-block", marginBottom: 16 }}>
            Who it&apos;s for
          </span>
          <h2 style={{ fontSize: "clamp(34px, 4.4vw, 56px)", fontWeight: 460, lineHeight: 0.98, letterSpacing: "-1.4px", color: "var(--fg-1)", margin: 0 }}>
            Built for operators who are{" "}
            <em style={{ fontStyle: "italic" }}>done experimenting</em>.
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 56 }} className="personas-grid">
          {PERSONAS.map((p) => (
            <div
              key={p.tag}
              className="gsap-reveal persona-card"
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
                padding: 32,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                overflow: "hidden",
                transition: "transform 240ms cubic-bezier(.22,1,.36,1), border-color 240ms ease, box-shadow 240ms ease",
              }}
            >
              <span className="persona-spotlight" aria-hidden />
              <span style={{ position: "relative", fontSize: 11, fontWeight: 700, color: "var(--amethyst-link)", letterSpacing: "1px" }}>{p.tag}</span>
              <h3 style={{ position: "relative", fontSize: 22, fontWeight: 540, letterSpacing: "-0.4px", color: "var(--fg-1)", margin: 0, lineHeight: 1.1 }}>{p.title}</h3>
              <p style={{ position: "relative", fontSize: 14, fontWeight: 460, lineHeight: 1.55, color: "var(--fg-2)", margin: 0 }}>{p.description}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .persona-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255,165,82,0.55) !important;
          box-shadow: 0 20px 50px rgba(255,138,61,0.1);
        }
        .persona-spotlight {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          transition: opacity 300ms ease;
          background: radial-gradient(240px circle at var(--mx, 50%) var(--my, 50%), rgba(255,165,82,0.14), transparent 60%);
        }
        .persona-card:hover .persona-spotlight { opacity: 1; }
        @media (max-width: 980px) { .personas-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 560px) { .personas-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
